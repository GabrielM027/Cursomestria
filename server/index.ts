/**
 * Servidor Express
 * 
 * Servidor backend que gerencia:
 * - Criação de preferências do Mercado Pago
 * - Webhook para processar pagamentos
 * - Serve o frontend em produção
 */

import express from 'express';
import { config } from 'dotenv';
import createCheckoutRoute from './routes/create-checkout';
import webhookRoute from './routes/webhook';

// Carregar variáveis de ambiente
config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// Rotas da API
app.use('/api', createCheckoutRoute);
app.use('/api/webhook', webhookRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Em produção, serve o frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/public'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'dist/public' });
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\u2705 Servidor rodando na porta ${PORT}`);
  console.log(`\u2705 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\u2705 URL: http://localhost:${PORT}`);
});

export default app;
