# Continuidade técnica e automação do site de concursos

> Este documento é público. **Não adicionar progresso individual, notas privadas, respostas pessoais, credenciais ou dados de inscrição a este repositório.** A Biblioteca privada do Projeto ChatGPT não é espelhada aqui.

## Fontes e responsabilidades

- **Regras permanentes:** instruções do Projeto Concurso e `/Concursos/REGRAS_GERAIS_ESTUDO.md` na Biblioteca privada.
- **Prioridade pedagógica individual:** `/Concursos/00_INDICE_E_CONTINUIDADE.md` e estados/planos privados do concurso. Não copiar automaticamente resultados pessoais para um repositório público.
- **Editais, datas, distribuição de questões, calendário sugerido e janelas de prioridade exibidos no site:** `dados/concursos.json`. Alterações no JSON devem ser baseadas em edital/retificação verificados, com `updated_at` revisado.
- **Progresso pessoal:** `localStorage` (não é sincronizado por GitHub Pages). O backup geral JSON **v5**, gerado no painel, reúne leitura de RLM, Engenharia/Qualidade e Português, a preferência de marcar ao avançar em Português, disponibilidade, planejamento, questões e revisões. A restauração geral aceita backups v1–v4; a aula de Português aceita backup específico v1/v2 e seu trecho em backups gerais v4/v5. Nenhum upload ocorre sem ação do usuário.

## Automatização implementada

1. `assets/planner.js` carrega `dados/concursos.json` no navegador; se falhar, informa indisponibilidade em vez de inventar datas.
2. A prioridade exibida varia conforme as janelas de datas cadastradas e, quando encerradas, pede reavaliação. A mudança não edita os arquivos privados.
3. A agenda mostra atividades sugeridas, com marcação **manual** de realização e reversão.
4. A página de revisão gera automaticamente datas +1, +3 e +7 dias (intervalos configuráveis no JSON) a partir de **erros efetivamente registrados**; datas vencidas são exibidas ao abrir o site. Marcar a revisão como realizada continua sendo escolha do usuário.
5. `assets/quiz.js` fornece ligação **opt-in** para futuros questionários HTML: após correção de respostas completas, grava sessão em `ce_question_logs_v1`, que alimenta a página `revisoes.html`. Não categoriza a natureza do erro automaticamente. Atribuir autoria/fonte e gabarito é responsabilidade de quem prepara as questões.
6. `progresso.html` exibe pesos públicos de cada edital, leitura local e somente resultados privados que estiverem no navegador. Não importa nem inventa pontuações do histórico do ChatGPT.

## Integração de questionários — contrato de implementação

Adicionar à aula `<script src="../assets/quiz.js" defer></script>` e criar um formulário semelhante a:

```html
<form data-ce-quiz data-exam="ima" data-subject="ti"
      data-topic="Tópico do edital"
      data-source="Questões autorais, autoria identificada na aula">
  <fieldset data-ce-question="questao-1" data-correct="b">
    <legend>Enunciado autoral sobre o tópico</legend>
    <label><input type="radio" name="questao-1" value="a"> Alternativa A</label>
    <label><input type="radio" name="questao-1" value="b"> Alternativa B</label>
    <p data-ce-explanation>Justificativa do gabarito com referência ao conteúdo.</p>
  </fieldset>
  <button type="submit">Corrigir respostas e registrar resultado</button>
  <p data-ce-feedback role="status" aria-live="polite"></p>
</form>
```

Os rótulos do exemplo são **placeholder de desenvolvimento**, não uma questão pronta. As questões reais devem ter fonte externa verificável; adaptações e autorais, rótulo explícito. O script permite **uma tentativa por carregamento**; para tentar novamente, recarregar a aula. Questões anuladas: `data-annulled="true"` no `fieldset`. O registro tem `kind="nao-classificado"`, pois uma resposta errada isolada não prova que o erro foi conceitual.

## Pendências para outro agente

- [ ] Ligar o adaptador a quizzes reais/autorais revisados das aulas novas, com identificadores estáveis e testes de gabarito/fonte.
- [ ] Implementar testes automatizados (JS, links, marcação, importação/exportação, acessibilidade básica e responsividade) sem apagar progresso legado.
- [ ] Criar interface para confirmar ou editar o tipo de erro após correção de cada questão. Não inferir erro de atenção/leitura apenas pelo gabarito.
- [ ] Integrar o acompanhamento de revisões na agenda da semana, priorizando itens vencidos e dificuldade aferida, sem marcar revisão concluída automaticamente.
- [ ] Preparar sincronização **privada** opcional com autenticação e banco remoto (ex.: Supabase), após autorização e configuração pelo usuário. A API de `localStorage` é apenas local; GitHub Pages estático não executa serviços de backend.
- [ ] Planejar importação **privada e autorizada** de registros da Biblioteca do ChatGPT; não colocar dados históricos individuais no repositório.
- [ ] Adicionar rotina de verificação de edital/retificações com fontes oficiais, exigindo conferência antes de atualizar o JSON e sem criar alertas duplicados.
- [ ] Suportar novos concursos no catálogo, nos filtros e nos formulários a partir de `dados/concursos.json`, mantendo os concursos arquivados acessíveis.
- [ ] Confirmar publicação efetiva no Pages e executar testes funcionais em dispositivo real; commits no GitHub não confirmam que o navegador já serve a nova versão.

## Restrições

- Nunca publicar dados pessoais e privados no GitHub público.
- Não tratar marcar `Lido`, tempo na tela ou atividade programada como domínio.
- Não alterar as instruções permanentes ao mudar edital, datas, vagas, banca ou foco. Atualizar o índice privado e `dados/concursos.json` quando apropriado.
- Não afirmar que outro agente recebeu uma tarefa automaticamente: GitHub Issues servem de backlog até uma pessoa ou agente autorizado executá-las.

## 19/11/2026 — Aula de Português e compatibilidade

- Aula publicada no endereço estável `aulas/portugues-casan-19-11.html`, com 6 módulos e 21 IDs de subseções preservados, e links em `aulas.html`, `index.html` e no planejamento.
- Conteúdo aprofundado nas etapas 4.3 (funções de `que` e `se`) e 5.4 (acentuação, ortografia e formação de palavras); material autoral sem classificação de questão histórica como real.
- `assets/planner.js` exibe leitura autodeclarada de Português em `progresso.html` sem atribuir pontuação, estudo concluído ou domínio ao CASAN ou IMA.
- Backup geral v5 em `assets/site.js`: preferência `autoMark` de Português passa a ser exportada e restaurada, usando a chave local `concursos:casan2026:portugues:2026-11-19:subsections:v1:settings`. Backups gerais v1–v4 continuam aceitos. A aula importa o seu próprio trecho dos backups gerais v4/v5, sem sobrescrever dados de outras disciplinas.
- A restauração sempre requer ação explícita e confirmação do usuário. Não transferir nem publicar progresso pessoal no GitHub.
- Verificar acesso ao Pages e testes reais de navegador; validação de commit, HTML e scripts não equivale a teste interativo em todas as plataformas.
