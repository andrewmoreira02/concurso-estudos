# Concurso Estudos

Site de estudos por concurso, publicado em GitHub Pages, com HTML/CSS/JavaScript responsivos e progresso local de leitura.

## Navegação

- [Início](https://andrewmoreira02.github.io/concurso-estudos/) — painel geral.
- [Todas as aulas](https://andrewmoreira02.github.io/concurso-estudos/aulas.html) — catálogo pesquisável com filtros.
- [Raciocínio Lógico-Matemático](https://andrewmoreira02.github.io/concurso-estudos/aulas/rlm.html) — 11 módulos e 71 subseções numeradas.
- [Engenharia de Software e Qualidade](https://andrewmoreira02.github.io/concurso-estudos/aulas/engenharia-qualidade.html) — 10 capítulos e 37 etapas numeradas; material preparado, sem inferir que foi estudado.

Os links públicos dependem de o GitHub Pages estar habilitado e ter publicado a versão atual de `main`. Os arquivos estão no repositório independentemente do estado da publicação.

## Leitura interativa

- Cada subseção possui botão **Marcar como lido**, que também permite desfazer.
- A barra inferior permite navegar com **Anterior** e **Lido e próxima**, este último registrando a etapa ao avançar (com opção de desativar esse comportamento).
- Em **Opções**, a marcação por rolagem e tempo é **experimental e desativada inicialmente**. Quando ativada, exige pelo menos 25 segundos na etapa e passagem à seguinte, mas não comprova leitura efetiva nem domínio.
- O progresso das subseções de RLM permanece em `concurso_rlm_steps_v1`; o de Engenharia, em `concurso_eng_qualidade_steps_v1`. Marcação de módulo/capítulo é mantida separadamente.
- Progresso e preferências são salvos no `localStorage` quando disponível. O painel exporta/importa JSON com as duas aulas (formato v2, compatível com backups anteriores de RLM). A aula de Engenharia também inclui suas subseções no backup próprio.

## Organização

- `index.html` — página inicial e progresso.
- `aulas.html` — catálogo pesquisável; registrar aqui links somente quando o material estiver de fato publicado.
- `aulas/*.html` — materiais didáticos.
- `assets/site.css` e `assets/site.js` — estrutura do painel, catálogo, progresso e backup.
- `assets/reading.css` e `assets/reading.js` — menu, controles por etapa e navegação assistida.

Mantenha identificadores de aula e subseção estáveis ao publicar versões novas, para preservar o histórico local.

## Planejamento, progresso e revisões

- [Planejamento semanal](https://andrewmoreira02.github.io/concurso-estudos/planejamento.html): agenda baseada nos planos registrados da CASAN até 22/11/2026 e do IMA a partir de 23/11/2026. Apresenta 2h-base e extensão opcional para o IMA. Os dias disponíveis **não** são presumidos: cada um deve ser marcado pelo usuário.
- [Progresso por assunto](https://andrewmoreira02.github.io/concurso-estudos/progresso.html): compara os pesos de questões dos editais com a leitura real registrada no navegador e o histórico pedagógico, sem inventar percentual global de domínio.
- [Revisões dirigidas](https://andrewmoreira02.github.io/concurso-estudos/revisoes.html): registra sessões reais de questões por concurso, disciplina e tópico, acertos, válidas, anuladas e tipo de erro. Quando há erros, gera sugestões de recuperação após +1, +3 e +7 dias, reversíveis e sem notificações automáticas.

As alterações feitas diretamente no site salvam no `localStorage` (chaves `ce_plan_done_v1`, `ce_available_days_v1`, `ce_question_logs_v1`, `ce_review_done_v1`). Não sincronizam com a Biblioteca do ChatGPT ou outros navegadores.

O backup do painel inicial usa o formato versionado `concurso-estudos-progress` **v3** para preservar leituras RLM/Engenharia, planejamento, disponibilidade, sessões e revisões. Versões v1/v2 continuam importáveis. Não há questões de demonstração pré-registradas; resultados históricos CASAN são apresentados somente como evidência de referência, sem inserir sessões falsas na fila IMA.

**Estado de verificação:** commits no GitHub não são confirmação da implantação pública pelo Pages. A página publicada deve ser conferida separadamente.

## Organização dos dados variáveis e automação

**Não coloque datas ou pesos dos concursos nas instruções fixas do Projeto.** O site consulta `dados/concursos.json`: nele ficam datas, provas, matrizes, janelas de prioridade e agenda sugerida. A atualização desse arquivo **não substitui** a revisão do índice privado `/Concursos/00_INDICE_E_CONTINUIDADE.md` no ChatGPT.

O arquivo `assets/quiz.js` permite que futuros questionários HTML registrem automaticamente os resultados de tentativas realmente enviadas no navegador. A página `revisoes.html` usa esses resultados para gerar revisões sugeridas de +1, +3 e +7 dias; nenhum acerto é fabricado. Para usar o adaptador em uma aula, consulte [docs/CONTINUIDADE_E_AUTOMACOES.md](docs/CONTINUIDADE_E_AUTOMACOES.md).

O trabalho pendente para outros agentes está na [issue #1](https://github.com/andrewmoreira02/concurso-estudos/issues/1). Essa issue **não executa um agente automaticamente**.

## Limitações e privacidade

GitHub Pages fornece hospedagem **estática**: o progresso não sincroniza entre navegador, computador e celular sem configurar serviço externo e login. A limpeza de dados do navegador pode apagar o registro local. Não publique progresso, anotações privadas ou credenciais no repositório público. Os registros do site não alteram automaticamente os arquivos `.md` da Biblioteca do Projeto ChatGPT.
