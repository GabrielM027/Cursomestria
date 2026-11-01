# Seleção do Ano: quantidade de jogadores

A organização pode escolher de 1 a 11 posições, sempre incluindo exatamente um goleiro. A seleção existente continua com oito até que o administrador aplique outra quantidade e distribuição.

No painel, escolha **Quantidade de jogadores**, distribua as vagas entre zagueiros, meio-campistas e atacantes e use **Aplicar e selecionar os melhores**. O botão só fica disponível quando a soma corresponde ao total escolhido. Ao passar de um para dois atacantes, os dois mais bem classificados da posição são escalados automaticamente. A regra existente continua sendo votos de Bola Cheia, quantidade de destaques, pontos e nome como desempates. Candidatos sem votos não preenchem vagas automáticas.

O fluxo anterior de aplicação da formação permanece: uma confirmação informa que os ajustes manuais serão substituídos pelo cálculo automático. Depois é possível escolher nomes e mover cartões manualmente. A atualização em si não grava outra formação nem modifica escolhas existentes, votos, partidas ou jogadores.

O limite foi ampliado também nas restrições do banco. A página pública e o painel usam o total salvo. Grupos grandes são divididos em linhas de até três cartões, com altura do campo ajustável no celular.

## Verificação

- `pnpm check` e `pnpm build` aprovados; apenas o aviso preexistente de tamanho do bundle.
- `pnpm test`: 55 testes, incluindo aumento de 8 para 9 com o segundo atacante automático, totais até 11, desempates, vagas pendentes, nomes repetidos e salvamento das onze posições.
- `node scripts/testSelectionFormation.mjs`: PostgreSQL isolado, aplicação de todas as migrações, preservação dos registros, gravação/leitura de 11 posições, rejeição de 12 e manutenção das permissões administrativas.
- Componentes reais conferidos em navegador com transporte simulado e dados fictícios: fluxo de 8 → 9 → 11, ajuste manual, página pública, telas de 320/390/1440 pixels e grupo de dez meias. Sem erros de JavaScript, cartões sobrepostos ou recortados.
- A seleção real foi consultada antes da publicação: 1 goleiro, 2 zagueiros, 4 meias, 1 atacante e nenhum ajuste manual. A migração altera somente limites, sem DML em registros existentes.
