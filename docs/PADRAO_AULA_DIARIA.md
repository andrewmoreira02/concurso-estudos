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
