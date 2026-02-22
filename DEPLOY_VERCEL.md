# 🚀 Deploy do Curso Mestria na Vercel

## Checklist de Deploy

### 1. Preparar Código

```bash
# Verifique se todos os arquivos estão commitados
git status
git add .
git commit -m "Refatoração para arquitetura serverless Vercel"
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

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `VITE_SUPABASE_URL` | `https://tqkbehwjylktpfrguvlr.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | `sua_supabase_anon_key_aqui` | All |
| `VITE_APP_URL` | `https://seu-app.vercel.app` | Production |
| `VITE_APP_URL` | `http://localhost:5173` | Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `sua_supabase_service_role_key_aqui` | All |
| `MERCADOPAGO_ACCESS_TOKEN` | `seu_mercadopago_access_token_aqui...` | All |
| `MERCADOPAGO_PUBLIC_KEY` | `seu_mercadopago_access_token_aquiacbcf272-8b09-4a93-...` | All |
| `ADMIN_EMAIL` | `cursomestria@gmail.com` | All |

> ⚠️ **IMPORTANTE**: Substitua `seu-app.vercel.app` pela URL real após o primeiro deploy.

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

### 7. Atualizar VITE_APP_URL

Após o primeiro deploy, atualize a variável `VITE_APP_URL` com a URL real da Vercel e faça redeploy.

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
- Teste manualmente com cURL:
  ```bash
  curl -X POST https://seu-app.vercel.app/api/webhook-mercadopago \
    -H "Content-Type: application/json" \
    -d '{"type": "payment", "data": {"id": "123"}}'
  ```

### Matrícula não criada

- Verifique logs na Vercel (Functions > Logs)
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Verifique RLS policies no Supabase

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

## ✅ Verificação Final

- [ ] App está acessível na URL da Vercel
- [ ] Login/Cadastro funciona
- [ ] Checkout redireciona para Mercado Pago
- [ ] Pagamento de teste com cartão aprovado
- [ ] Webhook atualiza matrícula no Supabase
- [ ] Usuário tem acesso após pagamento
- [ ] Admin tem acesso total
