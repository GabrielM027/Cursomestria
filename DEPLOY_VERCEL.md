# 🚀 Deploy do Curso Mestria na Vercel

## Checklist de Deploy

### 1. Preparar Código

```bash
# Verifique se todos os arquivos estão commitados
git status
git add .
git commit -m "Ajustes finais pré-deploy"
git push origin main
```

### 2. Conectar na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe seu repositório do GitHub
4. **Framework Preset**: Other (ou deixe em branco)
5. **Root Directory**: `.` (raiz do projeto)

### 3. Configurar Environment Variables

Na Vercel, vá em **Settings > Environment Variables** e adicione:

#### Variáveis Públicas (Frontend)

Estas variáveis são expostas no código do frontend (prefixo `VITE_`):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon key) | `eyJhbGci...` |

#### Variáveis Secretas (Backend)

Estas variáveis são usadas **apenas** nas API Routes serverless:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SUPABASE_URL` | URL do Supabase (mesma do frontend) | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (service_role) | `eyJhbGci...` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso do Mercado Pago | `seu_mercadopago_access_token_aqui...` |
| `ADMIN_EMAIL` | Email do administrador | `admin@exemplo.com` |
| `APP_URL` | URL da aplicação na Vercel | `https://meu-app.vercel.app` |
| `COURSE_PRICE` | Preço do curso (em reais) | `197` |
| `COURSE_TITLE` | Título do curso (opcional) | `Curso Mestria - Acesso 1 Ano` |

> ⚠️ **IMPORTANTE**: 
> - `VITE_*` são públicas (expostas no frontend)
> - As demais são secretas (apenas backend)
> - `APP_URL` deve ser a URL real da Vercel **sem barra no final**
> - Após o primeiro deploy, atualize `APP_URL` com a URL gerada

#### Configuração por Ambiente

| Variável | Development | Production |
|----------|-------------|------------|
| `APP_URL` | `http://localhost:5173` | `https://seu-app.vercel.app` |

### 4. Deploy

Clique em **Deploy** e aguarde a build.

### 5. Configurar Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute o conteúdo de `supabase-setup-v2.sql`
4. Verifique se as tabelas foram criadas em **Table Editor**

### 6. Configurar Webhook do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Vá em **Suas integrações > [Sua App] > Webhooks**
3. Adicione um webhook:
   - **URL**: `https://seu-app.vercel.app/api/webhook-mercadopago`
   - **Eventos**: `Pagamentos`
4. Salve

### 7. Atualizar APP_URL

Após o primeiro deploy, atualize a variável `APP_URL` com a URL real da Vercel e faça redeploy.

---

## 🧪 Teste de Pagamento

### Cartão de Teste (Aprovado)

| Campo | Valor |
|-------|-------|
| Número | `5031 4332 1540 6351` |
| Validade | `11/25` |
| CVV | `123` |
| Nome | `APRO` |
| CPF | `12345678909` |

### Cartão de Teste (Rejeitado)

| Campo | Valor |
|-------|-------|
| Número | `5031 4332 1540 6351` |
| Validade | `11/25` |
| CVV | `123` |
| Nome | `OTHE` |

### Fluxo de Teste

1. Crie uma conta de teste
2. Vá para `/checkout`
3. Clique em "Ir para Pagamento"
4. Use o cartão de teste
5. Verifique redirecionamento para `/sucesso`
6. Acesse `/estudos` para verificar acesso

---

## 🔧 Troubleshooting

### Build falhou

- Verifique se todas as dependências estão no `package.json`
- Verifique logs de build na Vercel

### Webhook não funciona

- Verifique se a URL está correta no MP
- Verifique se `APP_URL` está configurado corretamente na Vercel
- Teste manualmente com cURL:
  ```bash
  curl -X POST https://seu-app.vercel.app/api/webhook-mercadopago \
    -H "Content-Type: application/json" \
    -d '{"type": "payment", "data": {"id": "123"}}'
  ```

### Matrícula não criada

- Verifique logs na Vercel (Functions > Logs)
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
- Verifique RLS policies no Supabase

### Erro "Credenciais não configuradas"

- Certifique-se de usar `SUPABASE_URL` (não `VITE_SUPABASE_URL`) no backend
- As variáveis `VITE_*` **não** funcionam em serverless functions

---

## 📁 Estrutura Final

```
curso_mestria/
├── api/                         # Vercel Serverless Functions
│   ├── create-checkout.ts       # POST /api/create-checkout
│   └── webhook-mercadopago.ts   # POST /api/webhook-mercadopago
├── client/                      # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── App.tsx
│   └── index.html
├── vercel.json                  # Configuração Vercel
├── supabase-setup-v2.sql        # Schema do banco
├── .env.example                 # Template de variáveis
└── package.json
```

---

## ✅ Checklist Final

- [ ] App está acessível na URL da Vercel
- [ ] Login/Cadastro funciona
- [ ] Checkout redireciona para Mercado Pago
- [ ] Pagamento de teste com cartão aprovado
- [ ] Webhook atualiza matrícula no Supabase
- [ ] Usuário tem acesso após pagamento
- [ ] Admin tem acesso total

---

## 📋 Variáveis de Ambiente - Checklist para Vercel

Copie e cole na Vercel (Settings > Environment Variables):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
ADMIN_EMAIL=
APP_URL=
COURSE_PRICE=197
COURSE_TITLE=Curso Mestria - Acesso 1 Ano
```
