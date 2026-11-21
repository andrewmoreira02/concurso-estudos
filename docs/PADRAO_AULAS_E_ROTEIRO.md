# Padrão editorial obrigatório e roteiro adaptativo — Concurso Estudos

Documento público de critérios técnicos e didáticos. NÃO registrar neste arquivo dados pessoais de leitura, respostas ou histórico de usuário; consultar esses dados somente em Supabase privado.

## Agente responsável

A tarefa agendada do ChatGPT **Manutenção horária Concursos**, habilitada em 19/11/2026, executa a curadoria, criação, revisão e publicação. O JavaScript do navegador só apresenta sugestões e permite leitura; **não cria aulas novas, não edita GitHub e não substitui a tarefa agendada**. A cada execução, conferir ferramentas/conexões efetivamente acessíveis e não fingir execução nem sincronização.

## Ordem operacional de cada execução

1. Ler na Biblioteca, nesta ordem: `/Concursos/REGRAS_GERAIS_ESTUDO.md`, `/Concursos/00_INDICE_E_CONTINUIDADE.md`, `{PRIORITÁRIO}/ESTADO_ATUAL.md`, `{PRIORITÁRIO}/PLANO_ESTRATEGICO.md`, `/Concursos/HISTORICO_COMPARTILHADO.md`. Se inacessível, declarar e prosseguir apenas com dados confiáveis disponíveis.
2. No GitHub, abrir `dados/concursos.json`, `docs/CONTINUIDADE_E_AUTOMACOES.md`, esta norma e o HTML exato de cada aula candidata. Não presumir sincronização da Biblioteca com o repositório.
3. Ler *somente por ferramentas autenticadas* a tabela privada de progresso no Supabase; identificar subseções Lido/Não Lido, atividades realmente marcadas, sessões avaliadas, erros por assunto e revisões pendentes. **Jamais registrar essas informações pessoais no GitHub público**, nem em commits, issues, logs de CI ou JSON público.
4. Determinar o concurso prioritário segundo data/editais verificados, foco obrigatório, disponibilidade informada, lacunas e peso. Evitar repetir leituras já marcadas, mas oferecer revisões/questões sem inventar domínio.
5. Escolher trabalho de maior retorno: (a) corrigir aula vazia/incorreta ou didática deficiente; (b) criar próxima aula de edital ainda não disponível; (c) melhorar navegação, acessibilidade e testes; (d) atualizar ordenação e catálogo.
6. Uma aula nova deve ser produzida COMPLETA antes de ser marcada **Disponível**; se não houver tempo para completar, registrar **Planejada**, sem link para arquivo inexistente.
7. Testar conteúdo, contas, legendas, estilo, IDs, interatividade, backups, quiz, celular, links, CI e deploy. A publicação só existe após commit e validação da implantação.
8. Atualizar `aulas.html`, `index.html`, `planejamento.html`, `dados/concursos.json` (se mudar matriz pública com fonte comprovada), este registro e `docs/CONTINUIDADE_E_AUTOMACOES.md`; evitar duplicatas e preservar links estáveis.
9. Reportar de modo conciso o que foi **realmente alterado/testado**, o que ficou pendente e qual é o próximo foco. Sem atualização substantiva, não criar commit desnecessário.

## Identidade visual única — obrigatória em TODAS as aulas

**Referência de organização:** a aula RLM. Todas as páginas de aula (RLM, Engenharia e Qualidade, Português, Banco de Dados, Segurança de APIs, Algoritmos/OO e novas publicações) devem compartilhar o padrão: cabeçalho consistente com o site, índice lateral por módulo e subseção, progresso de leitura no índice, hero com título e contexto do edital, módulos organizados, teoria e exemplos, controles individuais Lido no fim de cada subseção, navegação entre etapas.

- **CSS compartilhado:** incluir `../assets/lesson-unified.css` no final do `head`, depois dos estilos particulares, para padronizar cores, tipografia, hierarquia, cartões, índice, contraste, responsividade e quadros. Manter HTML e exemplos específicos de cada assunto.
- **Comportamento compartilhado:** incluir `../assets/lesson-unified.js` com `defer` e declarar `class="ce-lesson-page ce-rlm"`, `ce-eng`, `ce-pt` ou `ce-new` no `body`. Ajustar a classe quando criar nova arquitetura de aula.
- **Sem painéis administrativos no corpo das aulas:** não carregar `assets/adaptive.js` ou `assets/registration.js` nas páginas de aula; recomendações e inscrições aparecem no painel/planejamento, nunca como banner de "Sugestões locais" antes da teoria. Não exibir `Registro de leitura (não é avaliação)`, `Como usar esta aula`, `Prioridade atual de estudos` nem outros recados internos na entrada das aulas.
- **Configurações sem poluição visual:** manter controles opcionais de marcação ao avançar e backup/restauração/exportação em `<details>` inicialmente fechado intitulado **Configurações e backup da aula**, colocado após o conteúdo. O progresso continua sempre visível no índice. Controles e identificadores são preservados; evitar redesenhar mecanismos de persistência.
- **Conteúdo pedagógico continua acima de tudo:** não remover exemplos, fórmulas, diagramas, índices nem questões ao normalizar o visual. Quadro de fórmula com legenda em bloco visual; botão Lido ao fim; as novas aulas seguem o mesmo padrão inclusive no celular.
- **Teste obrigatório:** `scripts/verificar-padrao-aulas.mjs` valida as seis páginas em 320, 390, 430 e 1280 px, presença de cabeçalho/sumário/hero, ausência dos banners locais, controles de backup acessíveis em detalhes, erro JS e rolagem horizontal. Executar também `scripts/verificar-lido-final.mjs`, `scripts/verificar-mobile.mjs` e teste de sincronização, além do deploy GitHub Pages.

## Layout das subseções

Cada subseção numerada deve apresentar: título único/estável, ideia central, quando aplicar e hipóteses, exemplo completo resolvido e conferido, macete, armadilha quando pertinente, e o controle **Lido** individual e reversível **ao final da subseção**, DEPOIS de todo o conteúdo. Não posicionar Lido ao lado do título. Navegação Anterior/Próxima continua acessível.

- Preservar IDs/keys de progresso e fazer backup e migração não destrutiva ao alterar HTML.
- RLM já tem 71 IDs; Engenharia/Qualidade tem 37; Português CASAN 19/11 tem 21. Não regenerar identificadores sem contrato de migração.
- A versão publicada usa `assets/lesson-end-reading.js` para reposicionar os controles legados no final, além de `assets/lesson-enhancements.css`. **Em novas aulas, colocar o controle diretamente no HTML ao final da seção**, em vez de depender de realocação por JavaScript.
- Não inferir estudo por rolagem, tempo, clique em Próxima ou página publicada. A preferência explícita de marcar ao avançar, quando existente, permanece reversível.
- Teoria deve existir sem depender de narração sincronizada; uma seção composta apenas de controle/diagrama sem interpretação suficiente precisa ser ampliada.

## Fórmulas — quadro obrigatório

Toda fórmula importante deve ser apresentada em **um quadro separado** (não jogada em linha de texto), com:

1. Nome e objetivo: o que se está calculando.
2. Expressão em destaque visual legível em telas pequenas, com fração formatada corretamente quando necessário.
3. Legenda de **TODAS** as variáveis e unidades; significado de índices e expoentes.
4. Hipóteses/condições de validade (por exemplo, soma da PG para q ≠ 1).
5. Exemplo numerado desde os dados do enunciado até o resultado; verificação por caminho independente quando pertinente.
6. Alerta para erro usual, com distinção entre termo geral, soma, razão e índice.

**Exemplo de PA:** termo geral `a_n = a_1 + (n-1)r`, com `a_n` termo da posição n, `a_1` primeiro termo, `r` razão aditiva, `n` posição. Soma `S_n = (a_1 + a_n)n/2`, com legenda de `S_n`. Exemplo 4,7,10,... `a_10=31` e `S_10=175`. Para PG: `a_n=a_1*q^(n-1)` e `S_n=a_1*(q^n-1)/(q-1)`, se `q!=1`; `q=1` implica `S_n=n*a_1`. Exemplos devem ser conferidos.

No site, reutilizar `ce-formula-card`, `ce-formula-equation`, `ce-legend`, `ce-example` de `assets/lesson-enhancements.css`, garantindo contraste e responsividade. Outras fórmulas relevantes seguem o mesmo padrão.

## Auditoria automatizada

- `scripts/verificar-conteudo-rlm.mjs`: garante presença e densidade mínima das 71 subseções da aula RLM.
- `scripts/verificar-lido-final.mjs`: testa DOM de 129 controles Lido posicionados após conteúdo e quadros/legendas PA/PG.
- `scripts/auditar-conteudo-aulas.mjs`: revisa RLM, Engenharia e Português; falha quando alguma subseção não tem teoria mínima nem diagrama. Os itens com 35–84 palavras sem diagrama são sinalizados para curadoria, não automaticamente reprovados.
- `scripts/verificar-mobile.mjs`: testa 320/390/430px e navegação.
- `scripts/verificar-sincronizacao.mjs` e `scripts/verificar-adaptacao.mjs`: mantêm compatibilidade de dados e recomendações. CI deve passar antes da publicação.

**Pendências editoriais identificadas após a correção das seções críticas:** 13 trechos concisos em RLM (m1-s2, m2-s6, m3-s1, m3-s3, m10-s3, m10-s4, m10-s5, m11-s2 a m11-s7) e 11 em Engenharia/Qualidade (etapa-1-3, etapa-1-4, etapa-2-1, etapa-3-1, etapa-3-2, etapa-4-3, etapa-5-2, etapa-6-2, etapa-8-1, etapa-8-2, etapa-9-2). Eles têm algum conteúdo e NÃO devem ser rotulados como vazios: avaliar e aprofundar segundo a necessidade pedagógica em próximas rodadas. Português: nenhum trecho conciso sinalizado na auditoria.

## Fila obrigatória de leitura — meta de cinco aulas equivalentes

A cada execução da tarefa horária, calcular sobre aulas COMPLETAS, PUBLICADAS e pertinentes ao concurso ativo:

`F = soma((subseções_totais - subseções_Lido) / subseções_totais)`.

A meta é `F >= 5`. Por exemplo, cinco aulas com 60% já lidas somam apenas 2 aulas equivalentes ainda não lidas; é necessário acrescentar 3 aulas completas (sem repetir tópicos) para a reserva voltar a 5. Se `F < 5`, publicar novas aulas suficientes, com conteúdo completo, exercícios, navegação, backup/sincronização e revisão editorial; rascunhos, listas de temas e HTMLs vazios não contam. Se `F >= 5`, não criar material sem necessidade: reabrir as seis aulas e revisar primeiro exatidão do edital, legibilidade, exemplos, fórmulas, índice, conceitos, questões de prova verificáveis e lacunas sinalizadas.

Não publicar `F` do aluno no repositório: calcular no navegador/relatório privado ou via ferramenta autenticada ao Supabase. Conservar o status **Lido** como leitura, jamais prova automática de estudo ou domínio.

Em aulas novas usar `assets/new-lesson.css`, `assets/new-lesson.js`, `assets/lesson-unified.css` e `assets/lesson-unified.js` com botão Lido nativo no FINAL de cada `article.nl-section`; usar `assets/quiz.js` para questões autorais verificadas no material ou reais somente com caderno/gabarito/citação. O usuário considera textos didáticos genéricos, rótulos meta e avisos de foco estáticos dentro de aulas como erros: preferir recomendações dinâmicas no painel. Os avisos de inscrição ficam até confirmação explícita e são reversíveis.

**Aulas novas da primeira passagem:** `aulas/banco-dados.html`, `aulas/seguranca.html`, `aulas/algoritmos-oo.html`. As três anteriores continuam acessíveis: RLM 71 seções, Engenharia 37, Português 21. Total do catálogo atual: 6 aulas e 156 subseções.

## Questões e revisões: registro automático, sem formulário manual (19/11/2026)

- O estudante **apenas responde** questões dentro das aulas, simulados ou na revisão. Não pedir que digite data, disciplina, número de itens, acertos, erros ou anuladas em um formulário separado.
- Todo conjunto de perguntas deve usar `assets/quiz.js` e `data-ce-quiz` com metadados de concurso, assunto, disciplina e fonte; os campos `data-ce-question`, `data-correct`, `data-ce-explanation` são obrigatórios. Corrigir somente depois do envio de todas as respostas válidas.
- Para simulado interdisciplinar, `data-subject="mixed"` no formulário e `data-ce-subject` em cada questão; o motor grava **uma sessão por disciplina**, preservando separação de concurso.
- Registrar apenas avaliações realmente submetidas em `ce_question_logs_v1` e despachar `concurso:progress-change` para sincronização privada. Os campos extras `questionIds` e `wrongQuestionIds` documentam o diagnóstico sem afirmar automaticamente a causa do erro.
- Erros geram revisões configuráveis em `dados/concursos.json` (atualmente +1, +3 e +7 dias) por `assets/practice-auto.js`. No `revisoes.html`, clicar para abrir o quiz **não** marca revisão; ao enviar as respostas, o motor marca apenas o respectivo ID em `ce_review_done_v1` como **praticada**, reversível por backup/restauração e sem afirmar domínio. A correção de novo erro pode gerar outro ciclo.
- `dados/questoes.json` é público e contém SOMENTE questões **autorais** em 19/11/2026. Antes de incluir questões reais, verificar fonte/caderno/gabarito oficial, órgão, banca, cargo e ano; rotular adaptações e manter direito autoral. Todas as alternativas devem ter explicação dos distratores e revisão de ambiguidades.
- O bloco de **21/11/2026**, `aulas/questoes-casan-21-11.html`, tem 15 questões autorais em TI, Português, RLM, Legislação e Atualidades; é prática leve da véspera e **não conta** como aula completa na meta das cinco equivalentes. O treino `aulas/questoes-ima.html` tem 12 questões das matérias compartilhadas; não cobre integralmente Administração Pública e Legislação Ambiental, que precisam de futuras questões próprias.
- Ao planejar o IMA, considerar o núcleo de 2h e a disponibilidade confirmada, sem somar 20min extras a uma agenda já cheia. O `dados/concursos.json` reserva blocos de questões em dias selecionados, ajustando a carga de TI no mesmo período.
- Todo novo quiz deve passar em `scripts/verificar-pratica-automatica.mjs`: 15 questões CASAN distribuídas por disciplina, envio incompleto não registra nada, registros segmentados, erro gera revisão, quiz enviado registra revisão, IMA não recebe resultados CASAN, quizzes legados continuam funcionando. Privacidade: nenhum resultado individual em commit público.

## 20/11/2026 — Navegação Próxima => Lido e questões completas na tela

- **Padrão para todas as aulas:** clicar em **Próxima** marca como **Lido a subseção que está terminando**, nunca a subseção de destino. A opção começa ATIVADA por padrão, e pode ser desativada reversivelmente em "Configurações e backup da aula"; abrir/rolar a página não marca nada.
- Engenharia: opção antiga inicialmente desligada foi migrada uma vez em `aulas/engenharia-qualidade.html`; navegar usa o `data-next-step` que indica a seção de origem. RLM e Português também migram a preferência inicial uma vez; preservar os formatos e IDs de armazenamento. Aulas novas usam a navegação comum de `assets/new-lesson.js`, entre as nove subseções, com opção no painel final.
- Nenhuma nova aula pode ser publicada sem teste da navegação usando `scripts/verificar-avanco-lido.mjs`: progresso sincronizável, marcação de origem, seção de destino não marcada, reversão explícita e preferência desativável.
- **Questões de banca no site:** NÃO apresentar apenas a letra A–E com instrução "abra o PDF". A questão visível precisa mostrar **enunciado e texto de TODAS as alternativas** diretamente na página, acessíveis no celular. Quando não for adequado reproduzir itens originais, criar **adaptação textual própria claramente rotulada**, mantendo vínculo opcional com caderno/número/ano/banca e calculando um **gabarito próprio**; não reutilizar a letra do gabarito original automaticamente para uma questão reescrita.
- `dados/questoes-reais.json` fica como registro de procedência da prova FURB 2023, não como questões reproduzidas. `dados/questoes-adaptadas.json` contém 17 adaptações com 5 alternativas A–E, explicações e distratores. CASAN véspera: 13 adaptações + 2 autorais (legislação/atualidades). IMA: 12 adaptações dos temas de outra prova FURB. `assets/practice-auto.js` valida fontes e apresenta alternativas sem abrir PDF, e a página Revisões utiliza o mesmo motor. Os exercícios autorais antigos ficam como reserva.
- A prioridade continua sendo pesquisar provas reais com gabaritos finais verificáveis AOCP/FURB; adaptar o texto para o site **não** torna a adaptação uma questão original da banca. Mostrar proporção e procedência em cada simulado. Não inserir dados pessoais no GitHub.

## IMA-SC — padrão editorial de microaulas e questões (decisão de 21/11/2026)
- **Vigência:** aplicar ao IMA a partir de **23/11/2026**; até 22/11 a prioridade permanece CASAN, prova em 22/11. A CASAN conserva seu formato atual e a reserva de questões para depois de concluir conteúdo.
- **Unidade pedagógica:** uma microaula = uma seção tematicamente completa e explicada com profundidade (definição, motivo, exemplo resolvido, notação visual/SVG quando pertinente, macete, armadilhas e controle individual Lido reversível). Não fragmentar artificialmente um raciocínio só para encurtar páginas.
- **Ciclo recomendado:** leitura → marcação Lido → exibição da **Questão sugerida** vinculada ao assunto → questões em página separada, alternativas visíveis e botão Enviar → correção dos distratores e revisão espaçada conforme erros enviados → próxima microaula. Permitir acesso voluntário/adiamento de questões, mantendo-as pendentes; Lido não é Estudado/Avaliado/Estabilizado.
- **Estrutura de publicação:** 25 unidades de microaula e 25 conjuntos endereçáveis de exercícios **como primeiro lote**, usando dois templates compartilhados com URLs ?u=...; **não** exigir 50 arquivos HTML físicos. Três a quatro itens por conjunto inicial, ajustáveis à disponibilidade de provas reais adequadas. A curadoria privilegia FURB de mesma área, depois cargos semelhantes; adaptação deve ter fonte e gabarito próprio, autoral deve ser rotulada.
- **Catálogo:** dados/microaulas-ima.json e dados/questoes-ima-micro.json; aulas/microaula-ima.html?u=<ID> e aulas/questoes-micro-ima.html?u=<ID>; scripts assets/ima-micro.js, assets/practice-auto.js, assets/adaptive.js, assets/quiz.js. Toda unidade deve ser catalogada por disciplina e edital, preservando o índice original, exemplos e símbolos.
- **Compatibilidade:** a microaula reaproveita a subseção do HTML original sem apagar nem converter os registros ce_lesson_read_v1:<slug>; a aula antiga permanece como referência. Ao criar uma nova unidade, preservar identificadores, backup/sincronização privada e critérios da prova; não registrar dados privados no GitHub.
- **Recomendações:** a homepage exibe “Questão sugerida” para o IMA a partir de 23/11 quando houver uma seção Lido com conjunto não totalmente respondido; caso contrário, sugere a próxima microaula. A presença de questões publicadas não comprova avaliação; somente Enviar gera registros específicos do IMA. Não misturar avaliações CASAN.
- **Limite de cobertura:** primeiro lote extrai **7 unidades de TI**, **9 de Administração Pública** e **9 de Legislação Ambiental** de material já existente. São 25 unidades, 25 conjuntos, **78 posições de questão** (64 itens autorais novos + 14 referências preexistentes); não representam o Anexo V completo. Novas unidades de TI e Português/RLM devem ser acrescentadas com prioridade por peso, cobertura e desempenho, não pelo mero número de aulas.
- **Validação:** testar sintaxe JavaScript, JSON, links e ID, carregamento do HTML original e controles Lido, retorno à trilha, correção e persistência de resultados, cache, celular e implantação. Se o GitHub Pages ou teste fim-a-fim não for verificável, declarar o limite em vez de afirmar publicação funcional.

## Regra de auditoria mobile por elemento — 21/11/2026

- Em **320, 360, 390 e 430 px**, verificar não só `html.scrollWidth` mas cada contêiner rolável, SVG, tabela, fórmula, código, quiz e índice; nenhum conteúdo essencial pode exigir rolagem lateral interna ou externa.
- Para figuras com quatro ou mais elementos em colunas, preferir representação vertical semântica com texto integral e rótulos explícitos no celular. Não reduzir SVG de 660 unidades a texto microscópico; manter alternativa textual e relações entre conceitos.
- Registrar em `docs/AUDITORIA_MOBILE.md` cada HTML com SHA do próprio arquivo e SHA de CSS/JS dependentes, resoluções realmente testadas e evidência. Qualquer alteração dessas dependências invalida o estado `verificado` até novo teste.
- Não fechar a issue #2 sem varredura dinâmica de todas as aulas e páginas de questões e capturas inspecionadas. Uma correção pontual deve ser marcada `corrigido, aguardando teste`.
