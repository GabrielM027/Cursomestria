/**
 * Vercel Serverless Function: Create Checkout
 * 
 * Cria uma preferência de pagamento no Mercado Pago e retorna o link de checkout.
 * 
 * ENV VARS (backend):
 * - MERCADOPAGO_ACCESS_TOKEN: Token de acesso do MP
 * - APP_URL: URL da aplicação (não VITE_APP_URL)
 * - COURSE_PRICE: Preço do curso (default: 197)
 * - COURSE_TITLE: Título do curso (default: "Curso Mestria - Acesso 1 Ano")
 * 
 * Endpoint: POST /api/create-checkout
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const MERCADO_PAGO_API = 'https://api.mercadopago.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId, userEmail, userName } = req.body;

    // Validação
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    // Verificar configuração
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    // IMPORTANTE: Usar APP_URL (não VITE_APP_URL) no backend
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    // Preço e título configuráveis via ENV
    const coursePrice = parseFloat(process.env.COURSE_PRICE || '197');
    const courseTitle = process.env.COURSE_TITLE || 'Curso Mestria - Acesso 1 Ano';

    if (!accessToken) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
      return res.status(500).json({ 
        error: 'Configuração do Mercado Pago incompleta' 
      });
    }

    console.log('📦 Criando checkout:', {
      userId,
      courseTitle,
      coursePrice,
      appUrl: appUrl.replace(/\/$/, ''), // Log sem trailing slash
    });

    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: courseTitle,
          description: 'Formação completa de Mestre de Obras - 10 módulos, 80+ lições',
          quantity: 1,
          unit_price: coursePrice,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: userEmail || undefined,
        name: userName || undefined,
      },
      metadata: {
        user_id: userId,
        user_email: userEmail,
      },
      back_urls: {
        success: `${appUrl}/sucesso`,
        failure: `${appUrl}/falha`,
        pending: `${appUrl}/pendente`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/webhook-mercadopago`,
      external_reference: userId,
      statement_descriptor: 'MESTRIA CURSO',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    };

    const response = await fetch(`${MERCADO_PAGO_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro Mercado Pago:', error);
      return res.status(500).json({
        error: 'Erro ao criar checkout',
        details: error.message || 'Erro desconhecido',
      });
    }

    const data = await response.json();
    console.log('✅ Preferência criada:', data.id);

    return res.status(200).json({
      init_point: data.init_point,
      preference_id: data.id,
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar checkout:', error.message);
    return res.status(500).json({
      error: 'Erro interno ao criar checkout',
      details: error.message,
    });
  }
}
