# Concurso Estudos

Site de leitura para concursos, hospedável no **GitHub Pages**. Interface em português e tema escuro.

## Abrir

Após ativar **Settings → Pages → Deploy from a branch → main / (root)**:

- Página inicial: https://andrewmoreira02.github.io/concurso-estudos/
- Raciocínio Lógico-Matemático: https://andrewmoreira02.github.io/concurso-estudos/aulas/rlm.html

> O endereço só estará disponível quando o GitHub Pages for ativado e a publicação terminar.

## Como funciona

- `index.html`: painel com acesso aos materiais e progresso de RLM.
- `aulas/rlm.html`: aula completa compartilhada, 11 módulos e 71 subseções.
- `assets/site.css`: estilos do painel.
- `assets/site.js`: marcação **Lido** independente por subseção, progresso, backup e restauração.

Ao marcar uma subseção, o progresso é salvo no `localStorage` sob a chave `concurso_rlm_steps_v1`. A marcação dos módulos usa a chave `rlm_shared_done_v1` do material anterior, mantendo a leitura do legado `casan_rlm_done_v1`.

**Importante:** GitHub Pages é hospedagem estática. Não há login nem sincronização de progresso entre navegadores ou aparelhos. O salvamento local pode ser apagado com os dados do navegador. Utilize o backup JSON caso pretenda trocar de dispositivo. A marcação de leitura não indica domínio avaliado e não atualiza a Biblioteca do Projeto ChatGPT.

## Atualizar materiais

Alterações enviadas à branch `main` serão disponibilizadas pelo GitHub Pages quando o serviço estiver ativo. Para modificar o conteúdo da aula, preserve os identificadores `data-lesson-step="6.1"` e assim por diante: eles permitem manter as marcações de leitura depois de uma atualização.

## Privacidade

**Não publique dados pessoais ou documentos sensíveis** no repositório público. O progresso salvo no navegador não é automaticamente publicado no GitHub.
