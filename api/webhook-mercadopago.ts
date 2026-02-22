/**
 * Vercel Serverless Function: Webhook Mercado Pago
 * 
 * Recebe notificações do Mercado Pago sobre pagamentos
 * e atualiza o status da matrícula do usuário no Supabase.
 * 
 * IMPORTANTE: Processa TUDO antes de retornar resposta
 * 
 * SEGURANÇA:
 * - Consulta a API do MP para validar o pagamento
 * - Usa SUPABASE_SERVICE_ROLE_KEY para bypass de RLS
 * - Implementa idempotência via payment_id
 * 
 * Endpoint: POST /api/webhook-mercadopago
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

// Criar cliente Supabase com service role key (bypass RLS)
function getSupabaseAdmin() {
  // IMPORTANTE: Usar SUPABASE_URL (não VITE_SUPABASE_URL) no backend
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Credenciais do Supabase não configuradas (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Apenas POST é permitido
    if (req.method !== 'POST') {
      console.log('ℹ️ Método ignorado:', req.method);
      return res.status(200).json({ received: true });
    }

    const { type, data } = req.body;
    console.log('🔔 Webhook recebido:', type, data);

    // Processar apenas notificações de pagamento
    if (type !== 'payment') {
      console.log('ℹ️ Tipo ignorado:', type);
      return res.status(200).json({ received: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.error('❌ Payment ID não encontrado no payload');
      return res.status(200).json({ received: true, error: 'payment_id_missing' });
    }

    // Verificar configuração do Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
      return res.status(200).json({ received: true, error: 'config_error' });
    }

    // SEGURANÇA: Consultar API do MP para validar pagamento
    const paymentResponse = await fetch(
      `${MERCADO_PAGO_API}/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error('❌ Erro ao consultar pagamento no MP:', paymentResponse.status);
      return res.status(200).json({ received: true, error: 'mp_api_error' });
    }

    const payment = await paymentResponse.json();
    const userId = payment.external_reference || payment.metadata?.user_id;
    const userEmail = payment.metadata?.user_email;
    const status = payment.status;
    const amount = payment.transaction_amount;

    console.log('💳 Pagamento:', {
      id: paymentId,
      status,
      user_id: userId,
      amount,
    });

    // Verificar se tem user_id
    if (!userId) {
      console.error('❌ User ID não encontrado no pagamento');
      return res.status(200).json({ received: true, error: 'user_id_missing' });
    }

    // Verificar se pagamento foi aprovado
    if (status !== 'approved') {
      console.log(`ℹ️ Status do pagamento: ${status} - nenhuma ação tomada`);
      return res.status(200).json({ received: true, status });
    }

    // Inicializar Supabase Admin
    const supabase = getSupabaseAdmin();

    // IDEMPOTÊNCIA: Verificar se já processamos este pagamento
    const { data: existingPayment } = await supabase
      .from('enrollments')
      .select('payment_id')
      .eq('payment_id', paymentId.toString())
      .single();

    if (existingPayment) {
      console.log('ℹ️ Pagamento já processado:', paymentId);
      return res.status(200).json({ received: true, already_processed: true });
    }

    // Calcular datas
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // + 1 ano

    // UPSERT: Criar ou atualizar matrícula
    const { error: upsertError } = await supabase
      .from('enrollments')
      .upsert({
        user_id: userId,
        status: 'active',
        purchased_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: paymentId.toString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('❌ Erro ao criar/atualizar matrícula:', upsertError);
      return res.status(200).json({ received: true, error: 'db_error' });
    }

    console.log('✅ Matrícula ativada para usuário:', userId);

    // SÓ AGORA retornar 200 com sucesso
    return res.status(200).json({ received: true, processed: true });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error.message);
    // Sempre retornar 200 para evitar retries do MP
    return res.status(200).json({ received: true, error: error.message });
  }
}
