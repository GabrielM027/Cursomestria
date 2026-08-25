# AMIGOS F.C. — Pelada de Domingo

Aplicativo público e administrativo do AMIGOS F.C., com feed editorial, ranking, artilharia, histórico de partidas, galeria, cadastro do elenco e lançamentos protegidos.

## Arquitetura

| Camada | Serviço |
|---|---|
| Interface | React 19, Vite e Tailwind CSS 4 |
| Dados e autenticação | Supabase Postgres, Auth e Row Level Security |
| Fotos e vídeos | Supabase Storage |
| Funções seguras | Vercel Functions |
| Hospedagem | Vercel conectada a este repositório GitHub |

## Configuração do Supabase

Crie ou selecione um projeto Supabase e execute, nesta ordem, os arquivos abaixo no SQL Editor:

1. `supabase/migrations/001_amigos_fc.sql`
2. `supabase/seed.sql`

Depois siga `supabase/BOOTSTRAP_ADMIN.md` para criar a primeira conta do Painel.

## Variáveis na Vercel

Cadastre as quatro variáveis abaixo em **Project Settings → Environment Variables**, aplicando-as a Production, Preview e Development:

| Variável | Origem |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/publishable key |
| `SUPABASE_URL` | O mesmo Project URL, usado somente pela função serverless |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role/secret key |

> Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em uma variável iniciada por `VITE_`, pois ela é privada.

## Desenvolvimento local

```bash
pnpm install
pnpm dev
```

Para compilar e validar:

```bash
pnpm check
pnpm test
pnpm build
```

## Segurança

As tabelas usam políticas de acesso: o público pode consultar resultados e conteúdos, mas apenas usuários autenticados com perfil ativo em `adminProfiles` podem alterar dados ou enviar mídias. A criação de novos administradores passa pela função serverless `api/create-admin.ts`, que valida o administrador atual e utiliza a chave privada somente no servidor.

## Recuperação do site anterior

O estado anterior do repositório foi preservado na branch `backup-mestria-before-amigos-fc-20260825`.
