# Verificação de Dados — Patrocinadores

Antes de criar a tabela de patrocinadores, foi carregada no editor SQL uma consulta somente leitura para conferir temporadas, jogadores, partidas, gols, destaques, galeria e ajustes de Seleção do Ano.

> A migração planejada é estritamente aditiva: criará apenas a tabela `sponsors`, seus índices, gatilho de atualização e políticas de acesso. Nenhuma tabela esportiva existente será excluída, recriada ou alterada.

| Registro conferido antes da migração | Quantidade |
|---|---:|
| Temporadas | 1 |
| Jogadores | 28 |
| Partidas | 15 |
| Gols | 77 |
| Destaques de rodada | 27 |
| Itens de galeria | 1 |
| Ajustes de Seleção do Ano | 0 |

## Resultado da migração

A migração `008_sponsors.sql` foi executada com sucesso no projeto Supabase correto. O banco retornou `Success. No rows returned`, resultado esperado para uma alteração de estrutura. A tabela `sponsors` foi criada vazia, pronta para receber somente logos reais cadastradas pelo administrador.

Uma nova consulta somente leitura foi preparada para confirmar as mesmas contagens esportivas e o total inicial de patrocinadores após a migração.

| Registro conferido após a migração | Quantidade |
|---|---:|
| Temporadas | 1 |
| Jogadores | 28 |
| Partidas | 15 |
| Gols | 77 |
| Destaques de rodada | 27 |
| Itens de galeria | 1 |
| Ajustes de Seleção do Ano | 0 |
| Patrocinadores cadastrados | 0 |

As contagens esportivas foram preservadas integralmente. A nova tabela começou vazia, sem dados fictícios de patrocinadores.
