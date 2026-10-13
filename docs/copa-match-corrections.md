# Correção auditada de partidas da Copa

Implementada em `feat/copa-match-corrections`, a partir da `main` em `7f4410bdacd435882d5988221b5864f5b6501171` do repositório `GabrielM027/Cursomestria`. A branch antiga `amigos-fc` não foi usada.

## Comportamento

Administradores ativos encontram **Corrigir partida** em confrontos concluídos da Copa, inclusive em torneios concluídos da temporada ativa. O formulário carrega os dados do banco e permite corrigir placar, escalação, convidados, gols individuais, votos, Melhor/Pior e pênaltis aplicáveis. A edição de data e observação continua disponível nesse mesmo fluxo.

O motivo é obrigatório. O histórico apresenta administrador, data, motivo e dados antes/depois. As tabelas existentes são reutilizadas; não há migração de dados nem alteração no layout público.

- Quartas seguem o cruzamento original: Q1 → lado preto da S1; Q4 → vermelho da S1; Q2 → preto da S2; Q3 → vermelho da S2.
- Semifinais atualizam o lado correspondente **nos dois jogos da final**.
- O primeiro jogo da final não define campeão. O segundo usa o agregado, sem regra de gol fora. Pênaltis decidem somente agregado empatado.
- Alterar vencedor é bloqueado se invalidar uma semifinal/final com resultado registrado. Resultados posteriores não são apagados ou recalculados automaticamente.
- O placar do primeiro jogo da final fica bloqueado após o segundo concluído. Estatísticas do primeiro continuam corrigíveis.
- Correções que mantêm o classificado podem ser feitas mesmo com fases posteriores concluídas.
- `countsForStandings` fica sempre `false` para a partida da Copa. Pontos e vitórias dos pontos corridos não são acrescentados; gols, saldo, votos e destaques continuam ativos.

## Integridade e autorização

`get_copa_match_state` fornece um snapshot com revisão determinística. `save_copa_match_result` valida o administrador no banco, bloqueia torneio/confrontos/partidas/estatísticas em ordem e rejeita revisões obsoletas. Resultado, estatísticas, avanço e auditoria são gravados na mesma transação. Qualquer erro, inclusive falha de auditoria, reverte tudo.

O encerramento normal da Copa usa a mesma RPC para compartilhar a ordem de bloqueios e evitar disputa entre encerramento e correção. Sua regra esportiva permanece a mesma.

As RPCs usam `SECURITY INVOKER`, `search_path` vazio, relações qualificadas e execução restrita a `authenticated`, além da checagem de administrador ativo. RLS permanece habilitado e não recebe permissões adicionais. O administrador é identificado por `auth.uid()` e seu nome é registrado no banco; não vem do formulário.

Triggers impedem que clientes antigos, a edição comum de partidas ou gravações REST diretas alterem resultados concluídos fora do fluxo auditado. Atualizações apenas de fotos/legendas dos destaques continuam disponíveis na aba Melhor/Pior.

Listas de participantes/gols/destaques são enviadas somente quando editadas. Linhas mantidas preservam IDs e metadados, e só recebem UPDATE quando seus campos mudam. Fotos, chaves e legendas de destaques são preservadas. Estatísticas legadas não editadas não são reescritas. Uma alteração de escalação que deixe gols/destaques inconsistentes exige correção explícita dessas linhas.

## Validação realizada

| Verificação                                                                      | Resultado                                                            |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| TypeScript (`tsc --noEmit`, script `check`)                                      | Passou                                                               |
| Vitest (`vitest run`, script `test`)                                             | 29 testes passaram, incluindo os 22 anteriores                       |
| PostgreSQL em memória (`node scripts/testCopaCorrections.mjs`, script `test:db`) | 28 cenários passaram                                                 |
| Build (`vite build`, script `build`)                                             | Passou                                                               |
| Diff (`git diff --check`)                                                        | Passou                                                               |
| Navegador Chromium, tela mobile e desktop                                        | Fluxo funcional validado com REST/RPC interceptados e banco fictício |

Os 28 cenários de banco executam todas as migrações do repositório num PostgreSQL PGlite 18.6, com substitutos locais de `auth`/`storage` e usuários fictícios. Cobrem os quatro cruzamentos das quartas, as duas semifinais, final com um/dois jogos, agregado/pênaltis, bloqueio de fases posteriores, escalação, convidados, votos/destaques, preservação de metadados, dados legados, autorização/RLS, revisão obsoleta, bypass por clientes antigos e rollback por falha de auditoria.

No navegador, o formulário foi testado até a chamada RPC e as alterações no banco, incluindo atualização da semifinal, preservação de estatísticas, registro do histórico, reabertura com dados novos, rejeição de revisão obsoleta e bloqueio de semifinal concluída. Não houve erro JavaScript. Todas as chamadas ao domínio Supabase foram interceptadas: nenhum dado real foi usado como teste.

Para reproduzir os testes automatizados:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm test:db
pnpm build
```

## Revisão e ativação posterior

A migração `supabase/migrations/20261013094842_copa_match_corrections.sql` **não foi aplicada em produção**. O projeto `tqkbehwjylktpfrguvlr` recebeu apenas consultas de leitura de schema/RLS/versão e integridade dos vínculos. Nenhuma partida real foi alterada, incluindo Marcão × Castro.

Após a aprovação, planejar uma janela para aplicar somente a nova migração e publicar o aplicativo atualizado juntos. Os triggers bloqueiam a versão antiga do encerramento/edição de resultados concluídos, e a versão nova precisa das RPCs. Evitar uma janela prolongada com versões incompatíveis. As migrações antigas já aplicadas não precisam ser reaplicadas.

A branch deste PR está desabilitada para deploy automático em `vercel.json`, exclusivamente pelo seu nome. Isso atende à revisão sem publicação e não desabilita a `main` nem outras branches. Não foi feito merge, deploy, promoção ou alteração de configuração remota.

Limitações de validação: o Supabase de produção usa PostgreSQL 17.6; a validação de SQL/roles/transações foi feita em PostgreSQL embarcado 18.6. Concorrência foi exercitada pela rejeição de revisões obsoletas; contenção real com múltiplas conexões e o gateway PostgREST/Supabase hospedado devem ser confirmados em homologação após revisão. O build mantém o aviso de bundle maior que 500 kB, já presente antes desta mudança.
