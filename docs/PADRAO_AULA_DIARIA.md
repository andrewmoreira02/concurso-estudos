# Modelo obrigatório de aulas diárias — vigente a partir de 24/11/2026

Esta decisão substitui a regra de criação de novas microaulas de 21/11. As antigas permanecem acessíveis; não apagar IDs, resultados, nem histórico. O conteúdo de cada dia pode reunir várias disciplinas, módulos e subseções conforme prazo, disponibilidade informada e progresso privado efetivamente consultado. A unidade de publicação é uma aula diária, não uma página por microassunto. Não fixar quantidade de tópicos; criar conteúdo substantivo e ajustar a aula do dia sem reiniciar partes já estudadas.

## Criar ou atualizar uma aula
1. Ler regras de continuidade e edital; escolher tópicos por retorno e lacunas. Consultar estado privado somente por conexão autorizada.
2. Copiar `modelos/aula-diaria.exemplo.json` para `dados/aulas-diarias/<id>.json`. Exemplo de ID estável: `ima-2026-11-24`. Preencher apenas conteúdo, não HTML de layout, CSS ou JS. Não incluir dados pessoais, respostas ou progresso.
3. Rodar `node scripts/gerar-aula.mjs dados/aulas-diarias/<id>.json`. Gera `aulas/<id>.html` estático com cabeçalho, menu, índice, contadores, Lido ao final de cada subseção, ferramentas de backup e scripts já usados no site. Não editar o HTML gerado manualmente. Não gerar/publicar o JSON demonstrativo como aula.
4. Ao atualizar, manter slug e IDs de módulos e subseções; adicionar novos IDs apenas para conteúdo novo. Não remover IDs existentes sem migração explícita, nem reutilizar ID de um tema para outro. O gerador recusa sobrescrever aulas legadas ou remover IDs de leitura.
5. Publicar JSON e HTML juntos, catalogar em aulas.html e vincular ao painel/planejamento conforme arquitetura vigente. Questões ficam em páginas separadas, com links opcionais `questions`. Não publicar links inexistentes. Não alterar status de estudo ao criar material.
6. Rodar `node scripts/verificar-gerador-aulas.mjs`, gerar novamente com `--check`, executar auditoria mobile, navegação, backup e sincronização com dados de teste. Verificar site após deploy. O gerador não cria catálogo, planejamento ou questões automaticamente; esses passos são obrigatórios na publicação.

## Formato de conteúdo
Campos: schema_version=1, id, date (AAAA-MM-DD), title, contest, subject (uma ou mais disciplinas), description, modules (id, title, sections), sources (label, url HTTPS), questions opcional (label, href relativo a aulas/). Cada section tem id, title e blocks; números visíveis são gerados por ordem, IDs não dependem da numeração.

| type | Campos | Uso |
|---|---|---|
| text | paragraphs[] | teoria completa |
| concept | title, paragraphs[] | conceito central ciano |
| list | items[] | tópicos ou sequência sem ordem |
| example | situation, steps[], conclusion | exemplo com situação concreta, raciocínio e conclusão |
| tip | text | memorização verde |
| warning | text | armadilha âmbar |
| formula | title, expression, legend[{symbol,meaning}], explanation | cálculo violeta com justificativa |
| table | title, headers[], rows[][] | comparação; usar cabeçalhos simples, conversão mobile pelo CSS/JS comum |
| code | code | código com quebra de linha |
| diagram | file, alt, caption, explanation[] | SVG local em assets/diagramas/, com alternativa textual completa |

Usar componentes conforme pertinência, não encher aula de cartões repetitivos. Diagramas UML/BPMN precisam mostrar notação real e legível, não mera descrição. SVG deve ser criado como conteúdo e revisado em mobile. Simuladores específicos que não existem nos componentes compartilhados exigem extensão reutilizável revisada, não scripts ad hoc em cada aula. O gerador escapa textos e não aceita HTML arbitrário.
 
## Validação e limites
O padrão reaproveita assets/new-lesson.css, assets/lesson-unified.css, assets/new-lesson.js, assets/lesson-unified.js, assets/sync-config.js, assets/sync.js e assets/reader-focus.js. As regras de Lido, backup e navegação são as do código existente; não há novo armazenamento. Não confundir leitura com estudo ou avaliação. Se houver alteração visual ou funcional, alterar componentes compartilhados e testar as dependências. Em 24/11 a validação estrutural foi feita com o modelo demonstrativo; a auditoria de navegador e a adaptação da fila de recomendações diárias permanecem pendentes. O padrão não migra aulas antigas, nem altera automaticamente a tarefa agendada ou a Biblioteca privada.


## Regra obrigatória — geradores compartilhados para qualquer recurso (24/11/2026)
Toda aula diária e todo questionário novo devem ser dados estruturados, não HTML/CSS/JS individual. Usar `scripts/gerar-aula.mjs` ou `scripts/gerar-questoes.mjs`, ambos com `scripts/componentes-conteudo.mjs` e `scripts/componentes-visuais.mjs`. Estilo global em `assets/componentes-didaticos.css`; correção/registro de questões usa o motor existente `assets/quiz.js`. Modelos em `modelos/` (não publicar como aula). Questões novas: `dados/questionarios/<id>.json` → `node scripts/gerar-questoes.mjs <arquivo>`; incluir alternativas completas, procedência, explicação e distratores. Verificar fontes externamente; não usar texto visual que entregue o gabarito.

**Regra de extensão:** se uma aula/questão precisar de um recurso ainda não suportado (ex.: gráfico de setores, BPMN, mapa, simulador, árvore, arrastar e soltar, editor de código), implementar primeiro o componente/gerador reutilizável, com contrato de dados, acessibilidade, exemplo e testes. Só depois criar o conteúdo. Proibido improvisar HTML/JS/CSS exclusivo como atalho. Imagens reais e SVG específicos são arquivos de conteúdo; o enquadramento, legenda, alternativa textual e comportamento ficam compartilhados. Não confundir gerador de exibição com geração automática de uma fotografia. Os componentes iniciais são imagem, SVG, fluxo vertical, barras, linhas e seis relações UML; os demais não estão implementados. Componentes de exercício novos devem integrar o motor comum sem presumir avaliação.

**Correção global:** identificar o componente responsável, corrigir no gerador ou CSS/JS compartilhado, executar `node scripts/regerar-materiais.mjs` para reconstruir TODOS os HTMLs derivados, executar testes, verificar mobile/quiz/backup, conferir diff e publicar juntos. Nunca corrigir só um HTML gerado. Erro factual no conteúdo isolado: corrigir JSON de origem. O CI `validar-geradores.yml` recusa HTML gerado desatualizado; não regenera ou publica sozinho. Legados ainda não migrados precisam de migração explícita, sem perda de IDs e resultados; não alegar correção automática neles. Não registrar progresso privado em GitHub. A auditoria visual e integração adaptativa continuam pendentes até testes reais.
