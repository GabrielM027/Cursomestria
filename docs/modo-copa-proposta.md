# Proposta — Modo Copa AMIGOS F.C.

> Documento de definição. Nenhuma regra desta proposta será aplicada ao site ou ao banco antes da aprovação do organizador.

## Objetivo

O Modo Copa é o torneio anual do AMIGOS F.C., realizado no fim da temporada — normalmente entre setembro e outubro. Ele transforma a pelada normal de domingo em uma disputa de mata-mata entre os oito destaques do ano, sem impedir que os demais participantes continuem jogando normalmente.

## Formato definido

| Item | Regra proposta |
|---|---|
| Participantes | Os oito melhores classificados pelos pontos corridos da temporada ativa. |
| Representação | Cada classificado representa o clube ou a seleção vinculada ao seu cadastro. |
| Estrutura | Quartas de final, semifinais e final. Com oito participantes, não há oitavas de final. |
| Jogos | Um confronto de Copa por domingo, totalizando sete jogos em sete domingos. |
| Confronto | Jogador contra jogador. Os dois classificados são capitães e escolhem os times entre todas as pessoas presentes naquele domingo. |
| Pelada normal | Continua acontecendo. Gols, placar, convidados, Melhor, Pior e votos do domingo permanecem disponíveis. |
| Empate | Todo empate em jogo de Copa é decidido nos pênaltis. |
| Avanço | O vencedor avança automaticamente para a chave seguinte após o resultado ser lançado. |
| Pontos corridos | Ficam congelados no momento em que a Copa começa. Jogos de Copa não concedem pontos nem vitórias a ninguém. |

## Classificação dos oito melhores

Os oito classificados são definidos exclusivamente pela classificação dos pontos corridos no instante em que a Copa é iniciada. O aplicativo salva uma fotografia desse ranking para que novos jogos não mudem os participantes.

1. Maior número de pontos.
2. Maior número de vitórias.
3. Maior número de gols.
4. Persistindo o empate na última vaga, decisão manual do organizador, com opção de editar a lista antes do sorteio.

Votos de Melhor e Pior não definem os classificados. Eles continuam sendo registrados durante a Copa como estatísticas individuais, junto de gols e saldo de gols.

## Congelamento do ranking geral

Ao confirmar **Iniciar Copa**, o sistema grava a data de início e congela a classificação dos pontos corridos. A partir daquele domingo, partidas de Copa não atribuem três pontos nem vitórias a ninguém. O ranking geral fica visível como a classificação final que definiu os oito participantes.

Gols, saldo de gols, Melhor da rodada, Pior da rodada e votos continuam sendo lançados para **todos os jogadores que participarem da pelada**, sejam capitães da Copa ou não. Um capitão eliminado também pode continuar jogando em outros times nos domingos seguintes, fazendo gols e melhorando suas estatísticas individuais. Essas estatísticas aparecem em um resumo separado da Copa, sem alterar a classificação por pontos corridos.

## Início e sorteio

Na administração, haverá uma área **Modo Copa** com os seguintes passos:

1. Selecionar a data do primeiro domingo da Copa.
2. Conferir a lista automática dos oito classificados e os critérios usados.
3. Confirmar os participantes.
4. Tocar em **Realizar sorteio**.
5. O sistema embaralha os oito jogadores e monta quatro confrontos de quartas de final, agendados para domingos consecutivos.
6. Antes de publicar o sorteio, o administrador pode refazer o sorteio. Depois de confirmado, o chaveamento é automático, mas todos os dados permanecem editáveis pelo organizador: participantes, confrontos, capitães, datas, resultado, pênaltis e vencedor em caso de correção.

## Lançamento de um domingo de Copa

No domingo de cada confronto, o lançamento de partida terá uma identificação de **Jogo de Copa**. O organizador verá os dois capitães daquele duelo e lançará normalmente os jogadores presentes, convidados avulsos, times, gols e votos.

Além do placar normal, haverá os campos de placar de pênaltis, usados somente se a partida terminar empatada. O sistema identifica o vencedor, registra o capitão vencedor e preenche automaticamente a próxima chave. Se um capitão não puder jogar, o organizador poderá ajustar a data, trocar a ordem das chaves ou editar o confronto antes de lançar o resultado.

Se um domingo for cancelado por chuva ou outro motivo, haverá uma ação **Adiar rodada da Copa**. Ela move o jogo pendente e todos os jogos posteriores uma semana à frente, sem alterar confrontos já encerrados.

## Controle total no painel administrativo

O Modo Copa não terá ações sem volta escondidas. A área administrativa mostrará claramente o estado atual do torneio e permitirá correções antes e durante a competição.

| Controle | Comportamento definido |
|---|---|
| Rascunho | Permite preparar a Copa e testar classificados, sorteio e datas sem aparecer no site público. |
| Iniciar | Publica o chaveamento, congela pontos e vitórias dos pontos corridos e ativa os destaques da Copa no site. |
| Editar | Permite alterar classificados, confrontos, capitães, datas, resultados, pênaltis e vencedor, recalculando as chaves posteriores quando necessário. |
| Pausar | Mantém todos os dados e o chaveamento salvos, mas deixa a Copa como pausada até o organizador retomar. |
| Adiar por chuva | Move uma semana o jogo pendente e todas as etapas posteriores. |
| Cancelar | Encerra a Copa e retira seu destaque público sem apagar a pelada, jogos, gols, votos ou galeria já registrados. |
| Cancelar teste e desfazer | Opção adicional para testes: desfaz o torneio de rascunho e restaura a operação normal antes de qualquer resultado oficial. |

Toda ação sensível de edição, pausa, cancelamento ou correção deverá pedir confirmação e registrar qual administrador executou a alteração, quando e por qual motivo.

## Controle de dados do site

O mesmo princípio de controle administrativo vale para as funções atuais e futuras. Estatísticas automáticas devem continuar sendo calculadas a partir das partidas, mas o painel terá uma área de correções manuais com motivo obrigatório e histórico visível aos administradores.

| Área | Controle administrativo necessário |
|---|---|
| Galeria | Editar legenda, data e imagem; excluir publicação com confirmação. |
| Partidas | Editar placar, participantes, gols, votos, destaques e excluir uma partida lançada por engano. |
| Ranking | Exibir cálculo automático e permitir correção manual de pontos, vitórias, gols e saldo de gols por lançamento identificado. |
| Copa | Iniciar, editar, pausar, adiar, cancelar, reiniciar teste e corrigir chaveamento. |
| Auditoria | Mostrar a correção, motivo, data e administrador responsável, sem esconder os dados originais. |

## Site público

Quando a Copa estiver ativa, a página inicial ganha um bloco especial com:

- aviso de que a Copa começou ou contagem para o próximo domingo;
- próximo confronto, com os dois classificados e seus símbolos;
- placar ou resultado do último jogo;
- chaveamento visual em formato de Copa do Mundo;
- link para uma página exclusiva da Copa, com elenco classificado, jogos, resultados e campeão.

O chaveamento mostra quatro quartas, duas semifinais e a final. Chaves ainda sem vencedor exibem “A definir”; as concluídas mostram placar, pênaltis quando houver e o classificado que avançou.

## Abertura especial da tela inicial

Enquanto a Copa estiver ativa, a abertura comum do feed é substituída por uma experiência especial de torneio. A primeira tela do celular apresenta **AMIGOS F.C. — COPA [ano]**, o status do torneio e uma chamada editorial, como “A Copa começou” ou “No próximo domingo tem quartas de final”.

Em seguida, aparece o próximo confronto em destaque grande: os dois capitães, seus clubes ou seleções, a data do jogo e o estado da chave. Abaixo, o usuário vê o chaveamento completo em formato de Copa do Mundo, adaptado para rolagem horizontal no celular, com quartas, semifinais e final.

O feed normal da pelada continua abaixo do chaveamento, com galeria, destaques, artilharia, saldo de gols e Melhor/Pior. Assim, durante a Copa, o site muda de clima e valoriza o mata-mata sem esconder a história normal de cada domingo.

## Pendências para aprovação

| Decisão | Opções sugeridas |
|---|---|
| Disputa de terceiro lugar | Não realizar, ou incluir um jogo extra entre os perdedores das semifinais. |
