# Relatório de Status — Patrocínios do AMIGOS F.C.

**Data de referência:** 28 de agosto de 2026  
**Ambiente público:** [amigosfc.vercel.app](https://amigosfc.vercel.app/)  
**Situação geral:** Operacional, com cadastro administrativo, faixa animada e seis patrocinadoras ativas.

## 1. Visão geral

A área de patrocínios está implantada na tela inicial do AMIGOS F.C. A faixa aparece acima do escudo quando não há uma Copa ativa, percorre as marcas continuamente e se adapta ao celular. Os patrocinadores são lidos do banco de dados, de modo que alterações salvas pelo painel administrativo são refletidas na faixa pública sem exigir uma nova alteração manual no código.

Atualmente, a faixa utiliza um cartão horizontal arredondado, que funciona como um **limite real de corte**. Isso impede que imagem, fundo ou logo ultrapassem o formato oval do cartão. A arte visual atual foi padronizada sobre fundo preto, com cada logotipo centralizado dentro do mesmo espaço visual.

| Indicador | Situação atual |
|---|---|
| Patrocinadores ativos | 6 marcas |
| Faixa pública | Ativa na abertura normal da tela inicial |
| Movimento automático | Ativo e mais rápido para dar rodagem às marcas |
| Controle administrativo | Disponível na aba **Patrocinadores** |
| Limite visual das logos | Máscara oval com corte real |
| Sincronização painel → site | Persistente por patrocinador |

## 2. Patrocinadoras cadastradas

As seis marcas abaixo estão ativas na faixa. A G&M Construções e Reformas foi removida conforme solicitação anterior e não aparece mais.

| Ordem | Patrocinadora | Apresentação atual |
|---:|---|---|
| 20 | Rota 27 | Fundo preto, escudo original centralizado |
| 30 | Elloskar Seminovos | Fundo preto, marca branca centralizada |
| 40 | Point Restaurante | Fundo preto, marca amarela e branca centralizada |
| 50 | FormaFit Academia | Fundo preto, marca vermelha e branca centralizada |
| 60 | Panificadora Marques | Fundo preto, identidade original centralizada |
| 70 | Goldcar Automóveis | Fundo preto, marca dourada e branca centralizada |

> As marcas não tiveram nome, símbolo, tipografia ou cor corporativa substituídos. Os ajustes efetuados foram limitados ao enquadramento, ao fundo de apresentação e à centralização dentro da faixa.

## 3. Faixa pública na tela inicial

A faixa foi posicionada acima do escudo da tela inicial e não utiliza mais o rótulo fixo “Apoio / Patrocinadores”. A rolagem é contínua, repetindo a sequência de patrocinadores para que não haja espaço vazio entre o fim e o início da animação.

| Comportamento | Configuração atual |
|---|---|
| Cartão público no desktop | 108 × 60 px, com bordas totalmente arredondadas |
| Cartão público no celular | 88 × 53 px, com bordas totalmente arredondadas |
| Tempo de ciclo no desktop | Aproximadamente 16 segundos |
| Tempo de ciclo no celular | Aproximadamente 13 segundos |
| Corte da imagem | `overflow: hidden` + máscara arredondada |
| Ordem de exibição | Ordem numérica definida no painel |
| Marcas ocultas | Não aparecem na faixa |

Quando a Copa estiver ativa, a abertura principal é substituída pela área especial do torneio. Portanto, a faixa de patrocinadores não aparece nessa abertura enquanto a Copa estiver em andamento; esse é o comportamento atual do produto.

## 4. Controles disponíveis no painel administrativo

Na aba **Patrocinadores**, o administrador pode criar uma nova marca ou editar uma já cadastrada. Os controles foram preparados para funcionar no celular e no computador.

| Controle | Função |
|---|---|
| Nome da marca | Identifica o patrocinador no painel e no texto alternativo da imagem pública |
| Logo da marca | Permite enviar uma imagem pelo painel administrativo |
| Visibilidade | Mostra ou oculta a marca sem excluir o cadastro |
| Ordem | Define a sequência da marca na faixa animada |
| Tamanho visual | Ajusta a escala entre 70% e 160% |
| Horizontal | Desloca a imagem para esquerda ou direita |
| Vertical | Desloca a imagem para cima ou para baixo |
| Enquadramento | Escolhe entre preencher o oval com corte ou mostrar a logo inteira |
| Prévia arrastável | Permite tocar/arrastar a logo dentro do limite oval antes de salvar |
| Edição | Altera logo, tamanho, posição, ordem e visibilidade |
| Exclusão | Remove somente aquele patrocinador da faixa |

O painel e a faixa pública agora usam a mesma proporção de cartão no celular e no desktop. Isso corrige a diferença anterior em que uma logo parecia centralizada na prévia, mas ficava deslocada ao ser vista na tela inicial.

## 5. Persistência e segurança

Os dados dos patrocinadores ficam na tabela `sponsors`. A estrutura foi criada e ampliada somente de forma aditiva, sem remover jogadores, partidas, gols, votos, destaques ou galerias existentes.

| Campo relevante | Uso |
|---|---|
| `name` | Nome administrativo da marca |
| `logoUrl` e `logoKey` | Referência da imagem exibida |
| `displayScale` | Escala visual persistida |
| `offsetX` e `offsetY` | Posição horizontal e vertical persistida |
| `fitMode` | Regra de preenchimento ou contenção da imagem |
| `sortOrder` | Sequência de passagem na faixa |
| `isActive` | Controle de visibilidade |

A leitura pública é limitada às informações necessárias para exibir a faixa. As operações de criar, editar e excluir exigem sessão administrativa autorizada. As migrações de patrocínio preservaram o conjunto de dados esportivos verificado durante as alterações: 28 jogadores, 15 partidas, 77 gols e 27 destaques, além das seis marcas atualmente ativas.

## 6. Estado das melhorias solicitadas

| Solicitação | Status |
|---|---|
| Faixa de patrocinadores acima do escudo | Concluída |
| Movimento automático contínuo | Concluída |
| Velocidade mais ágil para várias marcas | Concluída |
| Remoção do rótulo fixo da faixa | Concluída |
| Cadastro de patrocinadores no painel | Concluída |
| Upload, edição, ordem, visibilidade e exclusão | Concluídos |
| Ajuste de tamanho de logo | Concluído |
| Ajuste manual horizontal e vertical | Concluído |
| Corte dentro do oval tracejado | Concluído |
| Correção de centralização painel → faixa | Concluída |
| Padronização das marcas sobre fundo preto | Concluída |
| Remoção da G&M da faixa | Concluída |

## 7. Recomendações de uso

Para adicionar uma marca nova, o fluxo recomendado é cadastrar primeiro o nome, enviar uma imagem com boa resolução e abrir a prévia. Depois, selecione **Preencher o oval** se desejar que a imagem ocupe o cartão inteiro, ou **Mostrar inteira** quando precisar preservar as bordas da logo. Use os controles horizontal e vertical — ou arraste diretamente na prévia — e salve somente depois de conferir o resultado.

Logos PNG/WebP com fundo transparente geralmente dão mais liberdade de enquadramento. Mesmo assim, a máscara garante que qualquer imagem com fundo retangular continue visualmente confinada dentro do cartão oval, sem ultrapassar as bordas.

## 8. Pendências funcionais

Não há pendência técnica crítica na área de patrocínios. A principal ação recomendada é testar o enquadramento de cada marca diretamente no celular e ajustar individualmente conforme o gosto da organização. Caso deseje manter a faixa também durante a Copa ativa, essa exibição pode ser adicionada como uma próxima melhoria independente.

---

**Referências internas:** implementação atual em `client/src/components/SponsorsAdminTab.tsx`, `client/src/pages/PublicPages.tsx`, `client/src/index.css`, `client/src/lib/sponsors.ts` e migrações `008_sponsors.sql` e `009_sponsor_logo_framing.sql`.
