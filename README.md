# 🏗️ Curso Mestria - Formação de Mestre de Obras

![Status](https://img.shields.io/badge/Status-FASE_1_COMPLETA-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)
![React](https://img.shields.io/badge/React-19.2.1-blue)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)
![Mercado Pago](https://img.shields.io/badge/Mercado_Pago-Integrado-blue)

Plataforma completa de curso online para formação de Mestres de Obras, com autenticação, sistema de pagamento e controle de acesso.

---

## ✨ Funcionalidades Implementadas (FASE 1)

### 🔐 Autenticação
- ✅ Sistema completo de login/cadastro
- ✅ Gerenciamento de sessões via Supabase Auth
- ✅ Perfis de usuário (Student/Admin)
- ✅ Detecção automática de admin por email
- ✅ Proteção de rotas

### 💳 Sistema de Pagamento
- ✅ Integração com Mercado Pago
- ✅ Checkout responsivo
- ✅ Múltiplas formas de pagamento (PIX, Cartão, Boleto)
- ✅ Webhook automático para processar pagamentos
- ✅ Páginas de retorno (sucesso/falha/pendente)

### 🎓 Controle de Acesso
- ✅ Verificação de matrícula ativa
- ✅ Gateway de acesso aos módulos
- ✅ Controle de expiração (1 ano)
- ✅ Bloqueio de conteúdo para não-matriculados
- ✅ Acesso total para admins

### 📚 Plataforma de Ensino
- ✅ 10 módulos estruturados
- ✅ 80+ lições organizadas
- ✅ Visualização de módulos e lições
- ✅ Interface Blueprint Industrial (tema escuro)

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 19.2** - Biblioteca UI
- **TypeScript 5.6** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS 4.1** - Estilização
- **Wouter** - Roteamento
- **Framer Motion** - Animações
- **Radix UI** - Componentes acessíveis

### Backend
- **Express 4.21** - Servidor Node.js
- **Supabase** - Auth + Database
- **PostgreSQL** - Banco de dados
- **Axios** - Cliente HTTP

### Pagamentos
- **Mercado Pago** - Gateway de pagamento

---

## 📦 Instalação Rápida

### 1. Clone o Repositório
```bash
git clone <url-do-repositorio>
cd curso_mestria
```

### 2. Instale as Dependências
```bash
pnpm install
```

### 3. Configure as Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
# Supabase (já configurado)
VITE_SUPABASE_URL=https://tqkbehwjylktpfrguvlr.supabase.co
VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_supabase_service_role_key_aqui

# Mercado Pago (PREENCHER)
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui

# Configurações
ADMIN_EMAIL=cursomestria@gmail.com
COURSE_PRICE=197.00
APP_URL=http://localhost:5000
```

### 4. Configure o Banco de Dados

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Abra o **SQL Editor**
3. Execute o arquivo `supabase-setup.sql`

### 5. Execute o Projeto

```bash
# Modo desenvolvimento
pnpm dev

# Modo produção
pnpm build
pnpm start
```

---

## 📖 Documentação Completa

Para instruções detalhadas de configuração, troubleshooting e informações sobre webhook, consulte:

👉 **[IMPLEMENTACAO_FASE1.md](./IMPLEMENTACAO_FASE1.md)**

---

## 🌐 Rotas da Aplicação

### Rotas Públicas
- `/` - Página inicial (landing page)
- `/login` - Login
- `/cadastro` - Criar conta

### Rotas Protegidas (Requer Login)
- `/checkout` - Página de pagamento
- `/estudos` - Área de estudos (requer matrícula)
- `/modulo/:slug` - Visualizar módulo (requer matrícula)

### Rotas de Retorno (Mercado Pago)
- `/sucesso` - Pagamento aprovado
- `/pendente` - Pagamento pendente
- `/falha` - Pagamento rejeitado

### API Routes
- `POST /api/create-checkout` - Criar preferência MP
- `POST /api/webhook/mercadopago` - Processar pagamentos
- `GET /api/health` - Health check

---

## 🎨 Design System

O projeto utiliza o design **Blueprint Industrial**:

- 🎨 **Cores**: Tema escuro com acentos laranja/azul
- 🔤 **Tipografia**: Bebas Neue (títulos) + IBM Plex Sans (corpo)
- 📐 **Layout**: Mobile-first, responsivo
- ✨ **Animações**: Framer Motion para transições suaves

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

```sql
profiles          -- Perfis de usuário
├── user_id (PK)
├── full_name
├── role (student/admin)

enrollments       -- Matrículas
├── user_id (PK)
├── status (pending/active/expired/cancelled)
├── purchased_at
├── expires_at
├── payment_id
├── payment_amount

modules           -- Módulos do curso
├── id (PK)
├── slug
├── title
├── description
├── order_index

lessons           -- Lições
├── id (PK)
├── module_id (FK)
├── title
├── content
├── type (video/text/quiz/practice)

user_progress     -- Progresso (FASE 2)
├── user_id (FK)
├── lesson_id (FK)
├── completed
```

---

## 🔒 Segurança

### Row Level Security (RLS)
- ✅ Todas as tabelas protegidas
- ✅ Usuários só acessam seus próprios dados
- ✅ Admins têm acesso total
- ✅ Operações via webhook usam service role key

### Variáveis de Ambiente
- ✅ Chaves públicas no frontend (`VITE_*`)
- ✅ Chaves privadas apenas no backend
- ✅ Service role key nunca exposta

---

## 🧪 Testando o Sistema

### Fluxo Completo de Teste

1. **Criar Conta**: `/cadastro`
2. **Fazer Login**: `/login`
3. **Acessar Estudos**: `/estudos` (bloqueado sem matrícula)
4. **Ir para Checkout**: Clicar em "Adquirir Curso"
5. **Realizar Pagamento**: Pagar via Mercado Pago
6. **Webhook Processa**: Matrícula é criada automaticamente
7. **Acesso Liberado**: Voltar para `/estudos`

### Cartões de Teste (Mercado Pago)

Use o modo Sandbox e cartões de teste:
- **Aprovado**: `5031 4332 1540 6351` (Mastercard)
- **CVV**: Qualquer 3 dígitos
- **Validade**: Qualquer data futura

---

## 📈 Estatísticas do Projeto

- **📦 Total de arquivos**: 90+
- **💻 Linhas de código**: ~11.000
- **🎓 Módulos**: 10
- **📚 Lições**: 80+
- **⏱️ Conteúdo**: 90+ horas

---

## 🚀 Próximas Etapas (FASE 2)

- [ ] Sistema de progresso do usuário
- [ ] Liberação progressiva de módulos
- [ ] Avaliações e quizzes interativos
- [ ] Certificado de conclusão
- [ ] Dashboard administrativo
- [ ] Relatórios e analytics
- [ ] Sistema de notificações
- [ ] Player de vídeo integrado

---

## 👥 Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação completa](./IMPLEMENTACAO_FASE1.md)
2. Verifique os logs do servidor
3. Verifique o console do navegador
4. Entre em contato: cursomestria@gmail.com

---

## 📄 Licença

Este projeto é proprietário e confidencial.

---

## 🏗️ Desenvolvido por

**Abacus.AI Deep Agent**  
Implementação FASE 1 - Fevereiro 2026

---

**Status**: ✅ FASE 1 COMPLETA E FUNCIONAL

🎉 A plataforma está pronta para receber os primeiros alunos!
