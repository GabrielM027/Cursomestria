# Criar o primeiro administrador

Depois de aplicar `migrations/001_amigos_fc.sql` e `seed.sql` no Supabase:

1. Abra **Authentication → Users → Add user**.
2. Informe o e-mail e a senha que serão usados no Painel e marque o e-mail como confirmado.
3. Copie o UUID do usuário criado.
4. Abra o SQL Editor e execute o comando abaixo, trocando os três valores indicados.

```sql
insert into public."adminProfiles" ("userId", name, email, "isActive")
values ('UUID_DO_USUARIO', 'Nome do administrador', 'email@exemplo.com', true);
```

Depois disso, o login em `/painel` será feito diretamente pelo Supabase Auth. A sessão permanece salva pelo navegador e é renovada automaticamente.
