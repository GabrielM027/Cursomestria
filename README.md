# 🏗️ Curso Mestria - Formação de Mestre de Obras

Plataforma de curso online para formação de Mestres de Obras, com arquitetura **100% serverless** para deploy na Vercel.

## 🚀 Arquitetura v2 (Serverless)

```
├── api/                         # Vercel Serverless Functions
│   ├── create-checkout.ts       # POST /api/create-checkout
│   └── webhook-mercadopago.ts   # POST /api/webhook-mercadopago
├── client/                      # Frontend React + Vite
│   ├── src/
│   │   ├── components/          # Componentes UI
│   │   ├── contexts/            # AuthContext
│   │   ├── hooks/               # useEnrollment
│   │   ├── lib/                 # Supabase, courseData
│   │   └── pages/               # Páginas da aplicação
│   └── index.html
├── vercel.json                  # Configuração Vercel
├── supabase-setup-v2.sql        # Schema do banco (simplificado)
└── DEPLOY_VERCEL.md             # Guia de deploy
```

## ✨ Features

- **Autenticação**: Supabase Auth (email/senha)
- **Pagamentos**: Mercado Pago (PIX, Cartão, Boleto)
- **Acesso ao Curso**: Controle por matrícula com expiração
- **Admin**: Role-based access (admin/student)
- **Design**: Blueprint Industrial (dark theme, orange accents)

## 🛠️ Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Wouter (routing)
- Framer Motion (animations)
- Radix UI (components)

### Backend (Serverless)
- Vercel Serverless Functions
- Supabase (Auth + PostgreSQL)
- Mercado Pago API

## 📦 Instalação Local

```bash
# Clone o repositório
git clone <repo-url>
cd curso_mestria

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute em modo de desenvolvimento
pnpm dev
```

## 🌐 Deploy na Vercel

Consulte [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) para instruções completas.

### Resumo rápido:

1. Push para GitHub
2. Conecte na Vercel
3. Configure Environment Variables
4. Deploy
5. Execute SQL no Supabase
6. Configure webhook no Mercado Pago

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Onde |
|----------|-----------|------|
| `VITE_SUPABASE_URL` | URL do Supabase | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Chave pública Supabase | Frontend |
| `VITE_APP_URL` | URL da aplicação | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (secreta) | Backend |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso MP (secreto) | Backend |
| `ADMIN_EMAIL` | Email do admin | Backend |

## 🧪 Testes de Pagamento

### Cartão aprovado
- Número: `5031 4332 1540 6351`
- Validade: `11/25`
- CVV: `123`
- Nome: `APRO`

## 📁 Banco de Dados

Schema simplificado com apenas 2 tabelas:

- **profiles**: Perfis de usuários (user_id, full_name, role)
- **enrollments**: Matrículas (user_id, status, expires_at, payment_id)

Conteúdo do curso vem de `courseData.ts` (estático).

## 🔒 Segurança

- RLS (Row Level Security) habilitado
- Service Role Key apenas no backend
- Webhook valida pagamentos na API do MP
- Idempotência via payment_id único

## 📄 Licença

MIT
