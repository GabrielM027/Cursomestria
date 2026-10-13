# Próximo confronto em destaque no modo Copa

Alteração visual para a página inicial (`/`) enquanto a Copa estiver ativa/pausada e para a página pública `/copa`. Desenvolvida em `feat/copa-next-match-layout`, a partir da `main` em `43a0ae91784c61164716c621aa577b3e99f42929`.

## Comportamento

- O próximo confronto aparece logo abaixo do menu, com fase, título curto e dia/data programados.
- As bandeiras/escudos cadastrados ocupam círculos grandes: 140 px no celular de 390 px e 160 px no desktop verificado. Os capitães aparecem embaixo, com seus times/seleções.
- As duas bandeiras e o “×” permanecem alinhados, mesmo quando um nome ocupa duas linhas. Nomes longos quebram linha sem serem truncados.
- O título grande da Copa, “O mata-mata começou”, o selo dos oito classificados e o texto introdutório foram retirados. O chaveamento vem imediatamente depois do confronto, com título compacto.
- Fundo, bordas, cores, tipografia e espaçamento seguem a identidade do Amigos F.C. e dão prioridade ao confronto.
- A pausa continua sinalizada. Quando não há confronto definido, a mensagem de espera e o chaveamento continuam disponíveis. Imagens ausentes/com erro usam um símbolo neutro; não voltam a mostrar iniciais.

## Escopo e dados

`CopaHome` é compartilhado pelas duas páginas. A escolha do próximo confronto continua usando exatamente o filtro/ordenação anteriores. Capitães, nomes, bandeiras e datas vêm dos dados existentes; nenhum confronto foi fixado no código.

A árvore mantém os mesmos cruzamentos, resultados, conexões e a final em dois jogos. Em `CopaBracket.tsx`, somente o cabeçalho visual foi simplificado. A página inicial fora do modo Copa e as demais telas permanecem com seu conteúdo anterior.

Não houve mudança em consultas/RPCs, pontuação, estatísticas, autorização, edição administrativa, Supabase ou migrações. O banco não precisa de alteração para esta publicação.

## Verificação

| Verificação                        | Resultado                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| TypeScript (`tsc --noEmit`)        | Passou                                                                                          |
| Vitest                             | 32 testes passaram                                                                              |
| Build Vite                         | Passou                                                                                          |
| `git diff --check`                 | Passou                                                                                          |
| Chromium: `/` e `/copa`, 390 × 844 | Mesmo confronto, duas imagens circulares de 140 px, alinhadas; confronto no topo e chave abaixo |
| Chromium: 1440 × 1000              | Duas imagens de 160 px; layout e árvore completos                                               |
| Chromium: 320 × 760                | Nomes longos quebram linha, sem rolagem horizontal da página                                    |
| Estados alternativos               | Pausa, espera, imagem indisponível e indicação de dois jogos da final verificados               |
| Escopo                             | Página inicial fora da Copa e Pontos Corridos preservados                                       |
| Árvore                             | Oito confrontos e seis conexões mantidos no cenário fictício                                    |

Os dez cenários de navegador usaram exclusivamente respostas REST e imagens locais fictícias. Não houve chamada ao Supabase real, requisição de gravação ou erro JavaScript. Os nomes do exemplo foram usados somente como texto nos registros fictícios; nenhum registro de produção serviu de teste.

O build mantém o aviso anterior sobre bundle acima de 500 kB. Nenhuma dependência foi adicionada. A branch de trabalho tem deploy automático desabilitado por nome; a publicação autorizada usa a `main`.
