# Verificação prévia — enquadramento de logos

Antes da migração `009_sponsor_logo_framing.sql`, será registrada uma consulta somente leitura das contagens de jogadores, partidas, gols, destaques e patrocinadores. A alteração planejada é estritamente aditiva: novos campos de posição e enquadramento na tabela existente `sponsors`, sem remoção ou recriação de dados.

Consulta salva e executada no editor SQL antes da migração: **28 jogadores**, **15 partidas**, **77 gols**, **27 destaques** e **6 patrocinadores**. Nenhum registro existente será removido ou recriado pela mudança planejada.

A migração `009_sponsor_logo_framing.sql` foi salva e executada com sucesso. Ela adicionou apenas os campos `offsetX`, `offsetY` e `fitMode` em `public.sponsors`, todos com valores padrão seguros, preservando os seis cadastros existentes.

Na verificação pós-migração, as contagens permaneceram em **28 jogadores**, **15 partidas**, **77 gols**, **27 destaques** e **6 patrocinadores**. A consulta também confirmou a presença dos **3 campos** de enquadramento adicionados.
