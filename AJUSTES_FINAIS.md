# ✅ AJUSTES FINAIS PRÉ-DEPLOY

**Data**: 22/02/2026  
**Versão**: 2.1

---

## 1. Mudanças Realizadas

### 📦 api/webhook-mercadopago.ts

**Problema**: Retornava 200 ANTES de processar o pagamento.

**Correções**:
- ✅ Refatorado para processar TUDO antes de retornar resposta
- ✅ Fluxo: validações → consulta MP → idempotência → upsert → RETURN 200
- ✅ Usa `SUPABASE_URL` (não `VITE_SUPABASE_URL`)
- ✅ Usa `upsert` com `onConflict: 'user_id'` para simplicidade
- ✅ Todos os caminhos têm `return res.status(200).json(...)`

### 💳 api/create-checkout.ts

**Problema**: Preço fixo hardcoded e variáveis incorretas.

**Correções**:
- ✅ Removido preço fixo `197.00`
- ✅ Usa `COURSE_PRICE` (env var, default: 197)
- ✅ Usa `COURSE_TITLE` (env var, default: "Curso Mestria - Acesso 1 Ano")
- ✅ Usa `APP_URL` (não `VITE_APP_URL`)
- ✅ `notification_url` usa `${appUrl}/api/webhook-mercadopago`

### 🔒 supabase-setup-v2.sql (Versão 2.1)

**Problema**: Policy de SELECT em profiles usava `USING (true)`.

**Correções**:
- ✅ Removida policy `"profiles_select_authenticated"` (USING true)
- ✅ Criada policy `"profiles_select_own"` (student vê próprio)
- ✅ Criada policy `"profiles_select_admin"` (admin vê todos)
- ✅ Enrollments mantido (student só SELECT próprio)
- ✅ INSERT/UPDATE em enrollments bloqueado para users (só service_role)

### 📄 .env.example

**Atualizado com**:
- `VITE_SUPABASE_URL` - Frontend
- `VITE_SUPABASE_ANON_KEY` - Frontend
- `SUPABASE_URL` - Backend
- `SUPABASE_SERVICE_ROLE_KEY` - Backend
- `MERCADOPAGO_ACCESS_TOKEN` - Backend
- `ADMIN_EMAIL` - Backend
- `APP_URL` - Backend
- `COURSE_PRICE` - Backend
- `COURSE_TITLE` - Backend

### 📋 DEPLOY_VERCEL.md

**Atualizado com**:
- Seção completa de Environment Variables
- Explicação: `VITE_*` = públicas, outras = secretas
- Checklist de variáveis para copiar/colar
- Troubleshooting atualizado

---

## 2. Código Atualizado

### api/webhook-mercadopago.ts

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Validações iniciais
    if (req.method !== 'POST') {
      return res.status(200).json({ received: true });
    }

    const { type, data } = req.body;
    
    if (type !== 'payment') {
      return res.status(200).json({ received: true });
    }

    // Consultar API MP
    const paymentResponse = await fetch(`${MERCADO_PAGO_API}/v1/payments/${paymentId}`, ...);
    const payment = await paymentResponse.json();

    // Verificar status
    if (payment.status !== 'approved') {
      return res.status(200).json({ received: true, status: payment.status });
    }

    // Idempotência
    const { data: existingPayment } = await supabase
      .from('enrollments')
      .select('payment_id')
      .eq('payment_id', paymentId.toString())
      .single();

    if (existingPayment) {
      return res.status(200).json({ received: true, already_processed: true });
    }

    // Upsert enrollment
    await supabase.from('enrollments').upsert({
      user_id: userId,
      status: 'active',
      purchased_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_id: paymentId.toString(),
    }, { onConflict: 'user_id' });

    // SÓ AGORA retornar 200
    return res.status(200).json({ received: true, processed: true });

  } catch (error) {
    return res.status(200).json({ received: true, error: error.message });
  }
}
```

### api/create-checkout.ts

```typescript
// Preço e título configuráveis via ENV
const coursePrice = parseFloat(process.env.COURSE_PRICE || '197');
const courseTitle = process.env.COURSE_TITLE || 'Curso Mestria - Acesso 1 Ano';
const appUrl = process.env.APP_URL || 'http://localhost:5173';

const preference = {
  items: [{
    title: courseTitle,
    unit_price: coursePrice,
    quantity: 1,
  }],
  notification_url: `${appUrl}/api/webhook-mercadopago`,
  // ...
};
```

---

## 3. SQL Atualizado (RLS Policies)

```sql
-- PROFILES - Políticas Restritivas

-- Remover policy permissiva antiga
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

-- SELECT: Usuário vê apenas próprio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Admin vê todos os perfis
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ENROLLMENTS - Políticas

-- SELECT: Próprio usuário OU admin
CREATE POLICY "enrollments_select_own_or_admin" ON public.enrollments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- INSERT/UPDATE: Apenas via service_role (webhook)
-- Nenhuma policy = bloqueado para usuários normais
```

---

## 4. Checklist de Environment Variables para Vercel

### Variáveis Obrigatórias

```
# Frontend (público)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Backend (secreto)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
ADMIN_EMAIL=admin@exemplo.com
APP_URL=https://seu-app.vercel.app
```

### Variáveis Opcionais (têm defaults)

```
COURSE_PRICE=197
COURSE_TITLE=Curso Mestria - Acesso 1 Ano
```

---

## 5. Validação Final

| Verificação | Status |
|-------------|--------|
| Webhook processa TUDO antes de retornar | ✅ |
| Nenhum arquivo backend usa `VITE_*` | ✅ |
| Frontend usa apenas `VITE_*` | ✅ |
| SQL tem policies restritivas | ✅ |
| Preço vem de ENV | ✅ |
| Todos os arquivos consistentes | ✅ |

---

## ✅ PRONTO PARA DEPLOY

O projeto está pronto para ser deployado na Vercel. Siga os passos em `DEPLOY_VERCEL.md`.

### Próximos Passos:

1. Commitar as alterações
2. Push para GitHub
3. Deploy na Vercel
4. Configurar Environment Variables
5. Executar SQL no Supabase
6. Configurar Webhook no Mercado Pago
7. Testar fluxo completo com cartão de teste
