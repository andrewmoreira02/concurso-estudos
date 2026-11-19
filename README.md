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

## Limitações e privacidade

GitHub Pages fornece hospedagem **estática**: o progresso não sincroniza entre navegador, computador e celular sem configurar serviço externo e login. A limpeza de dados do navegador pode apagar o registro local. Não publique progresso, anotações privadas ou credenciais no repositório público. Os registros do site não alteram automaticamente os arquivos `.md` da Biblioteca do Projeto ChatGPT.
