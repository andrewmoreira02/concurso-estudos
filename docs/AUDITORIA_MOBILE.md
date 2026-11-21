# Auditoria mobile — Projeto Concurso

**Atualização: 21/11/2026.** Inspeção estática de fontes e alterações no repositório. Não houve confirmação de teste Playwright, inspeção de capturas em todos os tamanhos ou implantação pública neste atendimento. Nenhum registro de leitura ou desempenho pessoal foi publicado.

## Regra e retomada sem trabalho duplicado

- Testar em **320, 360, 390, 430 e 768 px**, incluindo overflow horizontal **interno e externo**, SVGs/UML, tabelas, fórmulas, código, menus, quiz e variantes de microaulas.
- O próximo agente só pode dispensar nova revisão se houver estado **verificado**, SHAs de HTML e dependências idênticos e evidência de testes visuais. **Corrigido, aguardando teste** não significa visualmente aprovado.
- O relatório automático **artifacts/auditoria-mobile.json** guarda SHA do HTML e de cada CSS/JS importado; executar **scripts/verificar-mobile.mjs** na Action **.github/workflows/auditoria-mobile.yml** e inspecionar as capturas geradas. A automação foi configurada, mas execução e resultados não foram confirmados.
- A regra pública está em **docs/PADRAO_AULAS_E_ROTEIRO.md**; a regra privada foi atualizada em **/Concursos/REGRAS_GERAIS_ESTUDO.md** na Biblioteca (não sincronizada com GitHub). A issue **#2 permanece aberta**.

## SHAs de dependências compartilhadas modificadas

- `assets/lesson-unified.css`: `3a7ab2aa57b59eb385523670bde27be26d962453`. Reorganiza tabelas, diagramas, código, fórmulas e fluxos para caber no celular.
- `assets/lesson-unified.js`: `3e10f55878f6ff624d0e9c02f6b10f119176e418`. Converte tabelas estáticas em cartões completos com rótulos no mobile, acrescenta leitura textual de SVGs amplos e observa HTML dinâmico.
- `assets/site.css`: `8391acbf74fcc13a17a040cc79498054a1ef7509`. Menus e filtros deixam de exigir scroll horizontal.
- `assets/new-lesson.css`: `80718b4594f74844907633c572158cf44b792bc3`; `assets/practice-auto.css`: `2aed520bac0604a1d0144c8ba0708306d1062dac`; `assets/lesson-enhancements.css`: `dd92ae1f47dc84b15aef70d930bdbc809add6fc1` (inspecionados, sem alteração nesta rodada).
- `scripts/verificar-mobile.mjs`: `d18adb5f471fae220aba50bae99058d8140387ee`. Agora enumera automaticamente arquivos da raiz e de `aulas/`, além de 25 microaulas e 25 conjuntos de questões por URL; emite evidência por SHA para cinco larguras.

## Inventário com revisão estática de código

**Método:** estrutura HTML, tipos de conteúdo e CSS de páginas do catálogo examinados por ferramenta. Foram aplicados ajustes CSS/JS genéricos e cache versionado; a ocorrência ou ausência de overflow em navegador ainda não foi medida. `corrigido, aguardando teste` é estado de implementação, não de validação.

| HTML | SHA (HTML) | Achado/ação em código | Telas comprovadas | Estado |
|---|---|---|---|---|
| `aulas/legislacao-casan-20-11.html` | `48b0bf702a1655195fd0ba3f8a31ca2a26372a1c` | Figura 1.1 quatro cartões verticais, CSS/JS com cache atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/rlm.html` | `d0cd13132a135cf51b74f3cd7886f6bf20117b9c` | 4 tabelas, 14 SVGs, fórmulas; reflow CSS e cartões | nenhuma — estático | corrigido, aguardando teste |
| `aulas/engenharia-qualidade.html` | `8aae4a2e95ba836b86a980054fd6d6d22517492a` | 8 tabelas, 15 SVGs, blocos código e fluxos; reflow | nenhuma — estático | corrigido, aguardando teste |
| `aulas/portugues-casan-19-11.html` | `c1830f1f6de83cd470639f6b9a6d7af20ff5d5b0` | 12 tabelas, 2 diagramas; cartões responsivos | nenhuma — estático | corrigido, aguardando teste |
| `aulas/banco-dados.html` | `03252e81ee264a39ba884939c78e4fdec52bf499` | 2 SVGs, 7 blocos de código; reflow e legenda | nenhuma — estático | corrigido, aguardando teste |
| `aulas/seguranca.html` | `eb45eb84e290d7b9ef0e57ad3ee8f103ed0eee5b` | 2 SVGs e 2 blocos de código; reflow e legenda | nenhuma — estático | corrigido, aguardando teste |
| `aulas/algoritmos-oo.html` | `00115febcd21179f2d075eb42423a47ddf132599` | 3 SVGs e 2 blocos de código; reflow e legenda | nenhuma — estático | corrigido, aguardando teste |
| `aulas/legislacao-ambiental-ima.html` | `d97e48070480c9e51767121625c9abce8c58689c` | 2 SVGs; reflow e legenda | nenhuma — estático | corrigido, aguardando teste |
| `aulas/administracao-publica-ima.html` | `a941fe559ebc5490ff99fccac7de9b3b75bf1c0d` | 2 SVGs; reflow e legenda | nenhuma — estático | corrigido, aguardando teste |
| `aulas/microaula-ima.html` | `832830118712db467032bcb3173150fde2c4171d` | Conteúdo carregado: observação dinâmica para cartões/diagramas | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-casan-21-11.html` | `59fcd65c48fd22704c76fbc6a147419d42b43586` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-engenharia-casan.html` | `b0138378af5aa8a49dc25f497172a60573190d0f` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-banco-dados-casan.html` | `8449db1f588535f209f043e92b2142a63294be0f` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-seguranca-casan.html` | `7dd114dc57a7729814f94485000898cb50bce22b` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-algoritmos-casan.html` | `3d0b96ff420b261e024912c3163537c75744b256` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-portugues-casan.html` | `435df0a61b6ec3faa369fe0a7066b4543cc498da` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-rlm-casan.html` | `753cb7515ebc2c1f1d793e3a4b669cd50fce6416` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-legislacao-atualidades-casan.html` | `4a5901ccefed689e57f19344320634e78365fd7f` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-micro-ima.html` | `4e60738688abe94ef482c8ee028c104c1a3b1d13` | CSS atualizado; 25 variantes por URL requerem teste | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-ima.html` | `5247ffa00161f574be00310442f69959aa01c4d6` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-ima-especificas.html` | `3672329d661c523af8648d69b2971b11e13896d5` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-extra-fundamentos-casan.html` | `2696db1cae4babd4f9d284b6a3baa02ba4f52c50` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-extra-processos-casan.html` | `aec12be6c1ae2c3f6d77115eb1b132dc6d9d6d9e` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-extra-web-legado-casan.html` | `e71fc275374c46c360889f6cdb6a8873cb13b27b` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-extra-lacunas-casan.html` | `1d3ac6751bdb79c126ca1291815a3f04aec1d8e7` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `aulas/questoes-extra-revisao-casan.html` | `366df5890fe4acd5836774c3abd6d7fe838ecff2` | CSS de questões atualizado | nenhuma — estático | corrigido, aguardando teste |
| `index.html` | `ec6c6300e886d577000427fc3f9c2a730dac4293` | Menu quebra linhas; CSS renovado | nenhuma — estático | corrigido, aguardando teste |
| `aulas.html` | `2c381908a4a79e35acc256fb828e10a87d1a275c` | Menus e filtros quebram linhas; CSS renovado | nenhuma — estático | corrigido, aguardando teste |
| `planejamento.html` | `c5eecc76d625eb96d3d3a949385bcd1281506af6` | CSS renovado, componentes dinâmicos pendentes | nenhuma — estático | corrigido, aguardando teste |
| `revisoes.html` | `4d9855b7e72d0cfc80f0525bd2d59e722fdafe70` | CSS renovado, formulários pendentes | nenhuma — estático | corrigido, aguardando teste |
| `conta.html` | `28c3b67d8e94d1dd1d14eb723be57d5f062d988f` | CSS renovado, sessão pendente | nenhuma — estático | corrigido, aguardando teste |
| `progresso.html` | `ec7aa2337549b9e85ae1fc2a45355658b2a53dee` | Redireciona para aulas.html, sem aula própria | nenhuma — estático | pendente |

## Próximos passos antes de marcar verificado

1. Executar a Action **Auditoria mobile**, recolher o JSON e imagens e registrar os resultados reais por HTML e por resolução, inclusive conteúdo oculto em scroll interno.
2. Inspecionar manualmente as figuras e relações semânticas (RLM: 14 SVGs; Engenharia: 15 SVGs; Português: 12 tabelas), testar 1.1 de Legislação em 320 e 390 px e verificar componentes dinâmicos das microaulas.
3. Corrigir falhas apontadas, reexecutar após mudanças de SHA e testar controles **Lido**, navegação, backup, questões e acessibilidade.
4. Verificar implantação GitHub Pages separadamente. Não fechar a issue #2 antes da inspeção visual e da cobertura de todos os HTMLs realmente encontrados pelo script.
