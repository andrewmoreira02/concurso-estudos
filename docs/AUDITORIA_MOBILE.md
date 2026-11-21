# Auditoria mobile — Projeto Concurso

**Iniciada em 21/11/2026.** Este arquivo contém somente verificações e alterações efetivamente executadas; não equivale à auditoria integral da issue #2. Estado `verificado` exige Playwright/Chromium com capturas visuais inspecionadas em 320, 360, 390 e 430 px, incluindo scroll interno e externo. Qualquer mudança de SHA do HTML/CSS/JS exige nova validação.

| HTML | SHA do HTML | CSS compartilhado SHA | Dependências JS | Larguras testadas | Falha identificada | Alteração | Evidência | Estado |
|---|---|---|---|---|---|---|---|---|
| `aulas/legislacao-casan-20-11.html` | `b6db86a2c3e570d5a414b59abbecefb5d2c6e9e0` | `0509bd65ffdd8617df3b4d0a6d95dbbaf64d3363` | A confirmar | Nenhuma em navegador | SVG de 660 unidades com CSS `min-width:540px` em viewport móvel; rolagem horizontal interna | Figura 1.1 convertida em quatro cartões semânticos, com distinção de competências e CSS de coluna única até 650 px | Inspeção do HTML/CSS no repositório; sem captura nem teste de scroll executado | **corrigido, aguardando teste** |

## Cobertura pendente

A enumeração automática de **todos** os HTMLs de aulas e questões, a captura de cada largura e a auditoria por SHA ainda não foram executadas. Não atribuir estado `verificado` a nenhum arquivo com base somente na inspeção estática. A issue #2 permanece aberta.
