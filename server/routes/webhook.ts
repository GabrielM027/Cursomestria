/**
 * Rota: Webhook do Mercado Pago
 * 
 * Recebe notificações do Mercado Pago sobre pagamentos
 * e atualiza o status da matrícula do usuário.
 */

import { Router } from 'express';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../client/src/lib/database.types';

const router = Router();

// Criar cliente Supabase com service role key (para bypass de RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️  ATENÇÃO: Credenciais do Supabase não configuradas!');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

router.post('/mercadopago', async (req, res) => {
  try {
    // Responder rapidamente ao Mercado Pago
    res.status(200).send('OK');

    const { type, data } = req.body;

    console.log('🔔 Webhook recebido:', type, data);

    // Processar apenas notificações de pagamento
    if (type !== 'payment') {
      console.log('ℹ️  Tipo de notificação ignorado:', type);
      return;
    }

    const paymentId = data.id;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
      return;
    }

    // Buscar informações do pagamento
    const paymentResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const payment = paymentResponse.data;
    const userId = payment.external_reference || payment.metadata?.user_id;
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

    // Se o pagamento foi aprovado, criar/atualizar matrícula
    if (status === 'approved') {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // + 1 ano

      // Verificar se já existe matrícula
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingEnrollment) {
        // Atualizar matrícula existente
        const { error } = await supabase
          .from('enrollments')
          .update({
            status: 'active' as const,
            purchased_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_id: paymentId,
            payment_status: status,
            payment_amount: amount,
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
          status: 'active' as const,
          purchased_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_id: paymentId,
          payment_status: status,
          payment_amount: amount,
        });

        if (error) {
          console.error('❌ Erro ao criar matrícula:', error);
        } else {
          console.log('✅ Matrícula criada para usuário:', userId);
        }
      }
    } else if (status === 'pending') {
      console.log('⏳ Pagamento pendente para usuário:', userId);
      
      // Atualizar status para pending se já existir matrícula
      await supabase
        .from('enrollments')
        .upsert({
          user_id: userId,
          status: 'pending' as const,
          payment_id: paymentId,
          payment_status: status,
          payment_amount: amount,
        });
    } else if (status === 'rejected' || status === 'cancelled') {
      console.log('❌ Pagamento rejeitado/cancelado para usuário:', userId);
      
      // Atualizar status para cancelled se já existir matrícula
      await supabase
        .from('enrollments')
        .update({
          status: 'cancelled' as const,
          payment_status: status,
        })
        .eq('user_id', userId);
    }
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error.response?.data || error.message);
  }
});

export default router;
