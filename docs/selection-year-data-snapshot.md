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
