# Validação do destaque ampliado de patrocinadores

Em 28 de agosto de 2026, a prévia local foi reiniciada durante a revisão do novo banner único de patrocinadores. O bundle passou por validação de tipos, testes e build antes da revisão visual.

O banner substitui a faixa pequena por um único destaque na entrada da tela inicial, com frase curta e alternância automática das marcas ativas.

A validação visual local confirmou a composição: bloco escuro amplo, frase de apoio à esquerda, logo de patrocinador em destaque à direita e indicadores discretos da alternância. O antigo ticker horizontal não é mais renderizado.

Após o refinamento de centralização, a prévia local permaneceu no estado de carregamento de dados durante a primeira tentativa de revisão. A validação do código foi concluída com sucesso; a publicação deve ser conferida pela implantação oficial após o envio.

Na revisão seguinte, a logo continuou pequena porque a regra genérica de logo substituía a dimensão específica do destaque. A prioridade do estilo foi corrigida para que o bloco grande do patrocinador mantenha seu tamanho no site.

Na correção do ciclo contínuo, o deslocamento final passou a usar a largura real do primeiro grupo duplicado. A validação em execução confirmou dois grupos e o mesmo valor de largura no deslocamento, eliminando o cálculo aproximado por porcentagem que causava o salto visual.
