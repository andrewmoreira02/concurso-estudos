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
