# Correção auditada de partidas da Copa

Implementada no repositório `GabrielM027/Cursomestria`. O fluxo original foi integrado pelo PR #3; a extensão de capitães foi desenvolvida em `feat/copa-captain-corrections`, a partir da `main` em `700c1aa11d40a7410de33b3f53bcb152be163c5d`. A branch antiga `amigos-fc` não foi usada.

## Comportamento

Administradores ativos encontram **Corrigir partida** em confrontos concluídos da Copa, inclusive em torneios concluídos da temporada ativa. O formulário carrega os dados do banco e permite corrigir capitães, placar, escalação, convidados, gols individuais, votos, Melhor/Pior e pênaltis aplicáveis. A edição de data e observação continua disponível nesse mesmo fluxo.

**Capitão do Preto** e **Capitão do Vermelho** podem ser escolhidos entre os classificados congelados daquela Copa. O botão **Inverter capitães** troca somente essas duas associações. Placar por cor, jogadores, gols e destaques permanecem iguais até uma edição explícita. Ao salvar, o vencedor é recalculado usando os capitães corrigidos; não é enviado manualmente pelo formulário. O histórico mostra as duas associações antes e depois, com os nomes congelados dos capitães.

O motivo é obrigatório. O histórico apresenta administrador, data, motivo e dados antes/depois. As tabelas existentes são reutilizadas; não há migração de dados nem alteração no layout público.

- Quartas seguem o cruzamento original: Q1 → lado preto da S1; Q4 → vermelho da S1; Q2 → preto da S2; Q3 → vermelho da S2.
- Semifinais atualizam o lado correspondente **nos dois jogos da final**.
- O primeiro jogo da final não define campeão. O segundo usa o agregado **por finalista**, inclusive quando as cores são invertidas entre os jogos, sem regra de gol fora. Pênaltis decidem somente agregado empatado.
- Alterar vencedor é bloqueado se invalidar uma semifinal/final com resultado registrado. Resultados posteriores não são apagados ou recalculados automaticamente.
- O placar do primeiro jogo da final fica bloqueado após o segundo concluído. Estatísticas do primeiro continuam corrigíveis.
- Corrigir capitães no primeiro jogo alinha o segundo somente enquanto este não tiver resultado registrado. Depois disso, a troca dos capitães do primeiro é bloqueada. No segundo jogo, as cores podem ser invertidas, mas os dois finalistas precisam ser os mesmos que disputaram o primeiro.
- Correções que mantêm o classificado podem ser feitas mesmo com fases posteriores concluídas.
- `countsForStandings` fica sempre `false` para a partida da Copa. Pontos e vitórias dos pontos corridos não são acrescentados; gols, saldo, votos e destaques continuam ativos.

## Integridade e autorização

`get_copa_match_state` fornece um snapshot com revisão determinística, incluindo os classificados congelados. `save_copa_match_result` valida o administrador no banco, bloqueia torneio/confrontos/partidas/estatísticas em ordem e rejeita revisões obsoletas. Os capitães devem ser distintos e pertencer à mesma Copa. Resultado, capitães, estatísticas, avanço e auditoria são gravados na mesma transação. Qualquer erro, inclusive falha de auditoria, reverte tudo.

O encerramento normal da Copa usa a mesma RPC para compartilhar a ordem de bloqueios e evitar disputa entre encerramento e correção. Sua regra esportiva permanece a mesma.

As RPCs usam `SECURITY INVOKER`, `search_path` vazio, relações qualificadas e execução restrita a `authenticated`, além da checagem de administrador ativo. RLS permanece habilitado e não recebe permissões adicionais. O administrador é identificado por `auth.uid()` e seu nome é registrado no banco; não vem do formulário.

Triggers impedem que clientes antigos, a edição comum de partidas ou gravações REST diretas alterem resultados concluídos fora do fluxo auditado. Atualizações apenas de fotos/legendas dos destaques continuam disponíveis na aba Melhor/Pior.

Listas de participantes/gols/destaques são enviadas somente quando editadas. Linhas mantidas preservam IDs e metadados, e só recebem UPDATE quando seus campos mudam. Fotos, chaves e legendas de destaques são preservadas. Estatísticas legadas não editadas não são reescritas. Uma alteração de escalação que deixe gols/destaques inconsistentes exige correção explícita dessas linhas.

## Validação realizada

| Verificação                                                                      | Resultado                                                            |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| TypeScript (`tsc --noEmit`, script `check`)                                      | Passou                                                               |
| Vitest (`vitest run`, script `test`)                                             | 32 testes passaram, incluindo os 22 anteriores                       |
| PostgreSQL em memória (`node scripts/testCopaCorrections.mjs`, script `test:db`) | 40 cenários passaram                                                 |
| Build (`vite build`, script `build`)                                             | Passou                                                               |
| Diff (`git diff --check`)                                                        | Passou                                                               |
| Navegador Chromium, tela mobile e desktop                                        | Fluxo funcional validado com REST/RPC interceptados e banco fictício |

Os 40 cenários de banco executam todas as migrações do repositório num PostgreSQL PGlite 18.6, com substitutos locais de `auth`/`storage` e usuários fictícios. Cobrem os quatro cruzamentos das quartas, as duas semifinais, final com um/dois jogos, agregado/pênaltis, bloqueio de fases posteriores, escalação, convidados, votos/destaques, preservação de metadados, dados legados, autorização/RLS, revisão obsoleta, bypass por clientes antigos e rollback por falha de auditoria. Os 12 novos casos verificam inversão de capitães, preservação integral das estatísticas, associação correta de pênaltis, propagação das semifinais, proteção de resultados posteriores, final com cores invertidas e rejeição de capitães inválidos/de outra Copa.

No navegador, o formulário foi testado até a chamada RPC e as alterações no banco, incluindo atualização da semifinal, preservação de estatísticas, registro do histórico, reabertura com dados novos, rejeição de revisão obsoleta e bloqueio de semifinal concluída. Não houve erro JavaScript. Todas as chamadas ao domínio Supabase foram interceptadas: nenhum dado real foi usado como teste.

A extensão de capitães também foi exercitada em desktop (1280 × 900) e celular (390 × 844): carregamento dos capitães atuais, seletores, inversão, envio somente dos dois IDs alterados, atualização da semifinal, auditoria e reabertura com os novos capitães. Placar, participantes, gols e destaques permaneceram iguais no banco fictício; nenhum erro JavaScript ocorreu.

Para reproduzir os testes automatizados:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm test:db
pnpm build
```

## Ativação e limites

O usuário autorizou a ativação após a revisão inicial. A migração original está aplicada no projeto `tqkbehwjylktpfrguvlr` com versão `20261013111845`, nome `copa_match_corrections`; o PR #3 foi integrado e publicado no Vercel. Nenhuma partida real foi corrigida durante a implementação ou os testes.

A extensão usa somente `20261013120530_copa_captain_corrections.sql`, que substitui as duas RPCs existentes preservando assinaturas, autorização, RLS e triggers. A migração não executa alterações em registros de jogadores, partidas, estatísticas ou confrontos. Aplicar esta migração antes de publicar o novo formulário; as migrações anteriores não precisam ser reaplicadas. A versão registrada pelo MCP no Supabase usa a data de aplicação e pode diferir do nome local.

As duas branches de funcionalidade estão desabilitadas para deploy automático em `vercel.json`, exclusivamente pelos seus nomes. A `main` continua habilitada para a publicação autorizada.

Limitações de validação: o Supabase de produção usa PostgreSQL 17.6; a validação de SQL/roles/transações foi feita em PostgreSQL embarcado 18.6. Concorrência foi exercitada pela rejeição de revisões obsoletas; contenção real com múltiplas conexões e o gateway PostgREST/Supabase hospedado devem ser confirmados em homologação após revisão. O build mantém o aviso de bundle maior que 500 kB, já presente antes desta mudança.
