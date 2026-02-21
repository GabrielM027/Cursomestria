/**
 * Rota: Criar Checkout
 * 
 * Cria uma preferência de pagamento no Mercado Pago e retorna o link de checkout.
 */

import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/create-checkout', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const coursePrice = parseFloat(process.env.COURSE_PRICE || '197.00');

    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN não está configurado');
      return res.status(500).json({ 
        error: 'Configuração do Mercado Pago incompleta' 
      });
    }

    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: 'Curso Mestria - Acesso 1 Ano',
          description: 'Formação completa de Mestre de Obras',
          quantity: 1,
          unit_price: coursePrice,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: req.body.email || undefined,
      },
      back_urls: {
        success: `${appUrl}/sucesso`,
        failure: `${appUrl}/falha`,
        pending: `${appUrl}/pendente`,
      },
      auto_return: 'approved' as const,
      notification_url: `${appUrl}/api/webhook/mercadopago`,
      external_reference: user_id,
      metadata: {
        user_id,
      },
    };

    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preference,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { init_point, id } = response.data;

    console.log('✅ Preferência criada:', id);

    res.json({
      init_point,
      preference_id: id,
    });
  } catch (error: any) {
    console.error('Erro ao criar checkout:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao criar checkout',
      details: error.response?.data || error.message,
    });
  }
});

export default router;
