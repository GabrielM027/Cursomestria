/**
 * Vercel Serverless Function: Webhook Mercado Pago
 * 
 * Recebe notificações do Mercado Pago sobre pagamentos
 * e atualiza o status da matrícula do usuário no Supabase.
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
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Credenciais do Supabase não configuradas');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sempre retornar 200 para o MP não reenviar
  // Processar em background
  res.status(200).json({ received: true });

  try {
    // Apenas POST é permitido
    if (req.method !== 'POST') {
      console.log('ℹ️ Método ignorado:', req.method);
      return;
    }

    const { type, data } = req.body;
    console.log('🔔 Webhook recebido:', type, data);

    // Processar apenas notificações de pagamento
    if (type !== 'payment') {
      console.log('ℹ️ Tipo ignorado:', type);
      return;
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.error('❌ Payment ID não encontrado no payload');
      return;
    }

    // Verificar configuração
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
      return;
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
      console.error('❌ Erro ao consultar pagamento no MP');
      return;
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

    if (!userId) {
      console.error('❌ User ID não encontrado no pagamento');
      return;
    }

    const supabase = getSupabaseAdmin();

    // IDEMPOTÊNCIA: Verificar se já processamos este pagamento
    const { data: existingPayment } = await supabase
      .from('enrollments')
      .select('payment_id')
      .eq('payment_id', paymentId.toString())
      .single();

    if (existingPayment) {
      console.log('ℹ️ Pagamento já processado:', paymentId);
      return;
    }

    // Se o pagamento foi aprovado, criar/atualizar matrícula
    if (status === 'approved') {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // + 1 ano

      // Verificar se já existe matrícula para o usuário
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (existingEnrollment) {
        // Atualizar matrícula existente
        const { error } = await supabase
          .from('enrollments')
          .update({
            status: 'active',
            purchased_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_id: paymentId.toString(),
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('❌ Erro ao atualizar matrícula:', error);
        } else {
          console.log('✅ Matrícula atualizada para usuário:', userId);
        }
      } else {
        // Criar nova matrícula
        const { error } = await supabase.from('enrollments').insert({
          user_id: userId,
          status: 'active',
          purchased_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_id: paymentId.toString(),
        });

        if (error) {
          console.error('❌ Erro ao criar matrícula:', error);
        } else {
          console.log('✅ Matrícula criada para usuário:', userId);
        }
      }
    } else {
      console.log(`ℹ️ Status do pagamento: ${status} - nenhuma ação tomada`);
    }
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error.message);
  }
}
