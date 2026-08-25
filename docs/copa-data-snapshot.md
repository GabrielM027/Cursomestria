# Verificação de preservação de dados — antes da Copa

Antes de qualquer migração do Modo Copa, foi preparada no Supabase uma consulta somente de leitura para registrar a quantidade atual de jogadores, temporadas, partidas, participantes, gols, destaques e publicações de galeria.

A consulta foi salva no SQL Editor antes da execução. Nenhum comando de alteração, exclusão ou recriação de tabelas foi executado nesta etapa.

| Dado real registrado | Quantidade antes da Copa |
|---|---:|
| Jogadores | 28 |
| Temporadas | 1 |
| Partidas | 1 |
| Participantes de partidas | 2 |
| Gols registrados | 0 |
| Destaques | 2 |
| Publicações de galeria | 1 |

## Migração preparada

A migração `005_copa_mode.sql` foi carregada integralmente e salva em uma nova consulta do Supabase. Ela cria somente tabelas, colunas, índices, permissões e políticas novos para a Copa. A consulta usa transação e não contém comandos de exclusão de jogadores, partidas, gols, destaques ou galeria.

O Supabase confirmou a execução com sucesso, sem linhas de retorno e sem erro. As estruturas adicionais da Copa estão prontas; nenhum jogador, temporada, partida, gol, destaque ou publicação existente foi removido.

Uma consulta somente de leitura foi preparada e salva para comparar as contagens reais após a migração, incluindo a quantidade inicial de copas criadas.

| Dado verificado após a migração | Quantidade confirmada |
|---|---:|
| Jogadores | 28 |
| Temporadas | 1 |
| Partidas | 1 |
| Participantes de partidas | 2 |
| Gols registrados | 0 |
| Destaques | 2 |
| Publicações de galeria | 1 |
| Copas criadas | 0 |

As contagens originais foram preservadas integralmente. A Copa começa sem dados de teste criados automaticamente.
