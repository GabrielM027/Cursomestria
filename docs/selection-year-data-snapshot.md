# Verificação de dados — Seleção do Ano

**Data:** 26 de agosto de 2026

Foi criada exclusivamente a tabela aditiva `selectionYearOverrides`, usada para guardar a troca de jogador e as coordenadas manuais dos oito espaços da Seleção do Ano. A alteração não removeu nem alterou jogadores, partidas, gols, destaques ou mídia existentes.

| Registro verificado após a migração | Quantidade |
|---|---:|
| Temporadas | 1 |
| Jogadores | 28 |
| Registros de temporada | 28 |
| Partidas | 15 |
| Participações em partidas | 231 |
| Gols lançados | 77 |
| Destaques de rodada | 27 |
| Itens de galeria | 1 |
| Ajustes manuais da Seleção do Ano | 0 |

> A nova tabela iniciou vazia. Isso confirma que o cálculo automático público permanece como estava até que um administrador salve uma formação manual.

## Conferência visual pública

Na prévia local, a página pública carregou os oito titulares reais da temporada na formação **1 goleiro, 2 zagueiros, 3 meio-campistas e 2 atacantes**. Os cartões passaram a ser compactos e os nomes foram mantidos dentro da área de cada cartão, sem cruzar as linhas do campo.

A consulta pública usa os dados reais do Supabase e pode exibir o estado breve de carregamento antes de renderizar a escalação; após a consulta concluir, a página mostrou os oito espaços preenchidos corretamente.

## Próxima evolução: formação livre

Antes de criar a configuração de formação livre por temporada, foi salva uma nova consulta somente leitura no SQL Editor para repetir a conferência de jogadores, partidas, gols, destaques e ajustes manuais existentes.

| Registro verificado antes da formação livre | Quantidade |
|---|---:|
| Temporadas | 1 |
| Jogadores | 28 |
| Registros de temporada | 28 |
| Partidas | 15 |
| Participações em partidas | 231 |
| Gols lançados | 77 |
| Destaques de rodada | 27 |
| Itens de galeria | 1 |
| Ajustes manuais da Seleção do Ano | 8 |

> Os oito ajustes manuais já existentes serão preservados. A nova estrutura apenas permitirá definir a quantidade de defensores, meio-campistas e atacantes antes do cálculo automático.

A migração preparada cria somente a tabela `selectionYearFormations` e amplia o limite técnico de numeração dos slots de três para sete. Nenhum jogador, partida, voto, foto ou ajuste manual existente será excluído.

A migração foi executada com sucesso no projeto Supabase correto, sem retorno de erro e sem inserir uma formação de teste. A configuração permanecerá no padrão atual até que um administrador escolha uma nova distribuição no painel.

Foi preparada uma segunda consulta somente leitura para confirmar novamente as contagens após a criação da tabela de formações, incluindo os ajustes manuais existentes e a nova tabela ainda vazia.

| Registro verificado após a formação livre | Quantidade |
|---|---:|
| Temporadas | 1 |
| Jogadores | 28 |
| Registros de temporada | 28 |
| Partidas | 15 |
| Participações em partidas | 231 |
| Gols lançados | 77 |
| Destaques de rodada | 27 |
| Itens de galeria | 1 |
| Ajustes manuais preservados | 8 |
| Formações gravadas automaticamente | 0 |

> As contagens permaneceram idênticas antes e depois da migração. Nenhuma formação foi criada automaticamente; a primeira configuração será salva somente quando a organização escolher a distribuição no painel.

Na prévia local, a página pública continuou carregando os oito titulares reais e a formação padrão existente enquanto nenhuma configuração personalizada foi gravada. Isso preserva a visualização atual até a primeira escolha feita pela organização.
