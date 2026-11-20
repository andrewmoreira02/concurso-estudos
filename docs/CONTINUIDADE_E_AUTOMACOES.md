# Continuidade técnica e automação do site de concursos

> Este documento é público. **Não adicionar progresso individual, notas privadas, respostas pessoais, credenciais ou dados de inscrição a este repositório.** A Biblioteca privada do Projeto ChatGPT não é espelhada aqui.

## Fontes e responsabilidades

- **Regras permanentes:** instruções do Projeto Concurso e `/Concursos/REGRAS_GERAIS_ESTUDO.md` na Biblioteca privada.
- **Prioridade pedagógica individual:** `/Concursos/00_INDICE_E_CONTINUIDADE.md` e estados/planos privados do concurso. Não copiar automaticamente resultados pessoais para um repositório público.
- **Editais, datas, distribuição de questões, calendário sugerido e janelas de prioridade exibidos no site:** `dados/concursos.json`. Alterações no JSON devem ser baseadas em edital/retificação verificados, com `updated_at` revisado.
- **Progresso pessoal:** `localStorage` por navegador, com opção de sincronização privada por pareamento Supabase via `assets/sync.js` (GitHub Pages sozinho não sincroniza). O backup geral JSON **v5**, gerado no painel, reúne leitura de RLM, Engenharia/Qualidade e Português, a preferência de marcar ao avançar em Português, disponibilidade, planejamento, questões e revisões. A restauração geral aceita backups v1–v4; a aula de Português aceita backup específico v1/v2 e seu trecho em backups gerais v4/v5. Nenhum upload ocorre sem ação do usuário.

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
- [x] Preparar frontend opcional de sincronização privada e esquema SQL com RLS no Supabase, autorizados pelo usuário; código e testes simulados disponíveis (detalhes abaixo). 
- [ ] **Ativar de fato o Supabase:** conectar projeto, executar SQL, testar isolamento RLS entre contas, configurar URL/chave pública, validar cadastro e sincronização real em computador e celular. O site permanece local até essa etapa.
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
- **Testes executados em 19/11:** HTML da Biblioteca validado com análise do DOM e `node --check` (6 módulos, 21 controles e IDs únicos), e em Chromium headless isolado (índice de 27 entradas, marca/desmarca individuais e em lote, Anterior/Próxima com preferência, exportação de backup da aula v2, importação do trecho de Português de backup geral v5, menu móvel). Nenhum erro JavaScript na simulação. Testes executados por `page.set_content`, sem carregar a hospedagem online; **não** equivalem a confirmação de implantação do GitHub Pages ou a testes em dispositivos físicos.
- Acesso efetivo ao GitHub Pages continua pendente de confirmação independente: ferramenta de navegação não conseguiu abrir a URL pública nesta sessão.

## Validação automática de conteúdo da aula RLM — 19/11/2026
- O arquivo `scripts/verificar-conteudo-rlm.mjs` valida as 71 subseções numeradas de `aulas/rlm.html`, IDs únicos, controles **Lido** individuais e de módulo, e um mínimo de texto próprio em cada etapa — descontando título e controles de navegação. O objetivo é detectar subseções vazias como a antiga 2.5 e os antigos painéis 4.4/4.5.
- A automação `.github/workflows/validar-conteudo-rlm.yml` executa esse teste em pushes e pull requests que alterem a aula, o script ou o workflow. Teste local: `node scripts/verificar-conteudo-rlm.mjs`. **Não substitui revisão didática humana, nem bloqueia implantação sem uma regra de proteção da branch.**
- Em 19/11, a seção 2.5 e outras nove subseções concisas tiveram conteúdos ampliados; os 71 IDs e estados de leitura existentes permaneceram estáveis. A execução do GitHub Actions foi concluída com sucesso. Não marcar essas seções como estudadas pelo usuário.


## 19/11/2026 — Leitura móvel e navegação por subseções

- **Aulas atuais:** `aulas/rlm.html`, `aulas/engenharia-qualidade.html` e `aulas/portugues-casan-19-11.html` receberam CSS responsivo próprio no HTML, mantendo leitura independente e preservando todos os IDs, conceitos, exemplos e chaves existentes de progresso. Tipografia, espaçamentos, largura de conteúdo, rolagem horizontal de tabelas e diagramas, alvos de toque, menus móveis e respeito ao `safe-area-inset-bottom` foram ajustados para smartphones.
- **RLM:** menu/índice móvel utilizável em tela pequena, com fechamento ao tocar fora; ações de backup/restauração mantidas, sem marcar leitura automaticamente. **Engenharia:** seletor móvel de módulos já existente foi mantido, com novo seletor gerado a partir das 37 subseções `etapa-*`; a navegação não altera leitura. **Português:** índice móvel fecha ao tocar fora ou pressionar Esc, mantendo a barra inferior Anterior/Próxima e controles de leitura.
- **Painel e páginas principais:** `assets/site.css` usa menu horizontal rolável com alvos de toque amplos em telas estreitas; `assets/planner.css` corrige larguras e tamanhos de controles em planejamento, progresso e revisões, sem mudar dados pessoais.
- **Validação efetivamente feita:** releitura dos HTMLs publicados no GitHub após commit, verificação estática de `viewport`, scripts JavaScript compiláveis, presença de índices móveis e preservação de chaves de leitura. Contagens mantidas: RLM 71, Engenharia 37, Português 21 subseções. A automação existente de validação RLM executou com sucesso para o commit `2632b92799c2` e o fluxo Pages **concluiu com sucesso** para o commit `f7ea54eeecd5`.
- **Teste automático de navegador:** adicionados `scripts/verificar-mobile.mjs` e `.github/workflows/validar-mobile.yml`, com Playwright Core e Chrome headless. O GitHub Actions concluiu **com sucesso** no commit `89179dd60221` (execução `44622923682`): 320, 390 e 430 px; oito páginas; teste de largura horizontal global, índices das aulas, 71/37/21 etapas, navegação e alvos de toque da navegação principal. O teste é de navegador automatizado, não de telefone físico.
- **Limitação restante:** a tentativa de abrir diretamente a URL pública a partir do agente falhou, embora o GitHub Actions tenha confirmado implantação em commit anterior. A validação automatizada não cobre todas as combinações de dispositivo, zoom e leitor de tela. Nenhum progresso privado foi publicado.

## 19/11/2026 — Sincronização privada entre celular e computador (preparada)

- **Autorização recebida:** implementar sincronização entre dispositivos mantendo progresso já marcado, sem publicar dados individuais no GitHub. O repositório recebeu `conta.html`, `assets/sync.js`, `assets/sync-config.js` (configuração vazia), `supabase/schema.sql`, `docs/SINCRONIZACAO_PRIVADA.md` e `scripts/verificar-sincronizacao.mjs`; os HTMLs de aulas, catálogo e painel carregam o cliente opcional.
- **Dados suportados:** leitura individual de RLM (71), Engenharia (37) e Português (21), atividades do plano, disponibilidade, sessões registradas, revisões concluídas e preferência de Português de marcar ao avançar. Nenhum marcador legado por módulo foi convertido em subseções estudadas; leitura não significa domínio.
- **Migração inicial:** primeiro login em cada aparelho preserva/unifica marcadores positivos existentes; depois, cada item tem marcações reversíveis e registro de exclusão. O dispositivo pode operar offline; em seguida tenta reconciliação autenticada. Conflitos simultâneos exatos podem priorizar dados locais; recomendação de backup JSON permanece.
- **Segurança:** chave pública e URL do Supabase apenas após configurar serviço com Auth e RLS por `auth.uid()`. Nada de `service_role`, JWT ou senha no repositório. Acesso a dados pessoais é privado por usuário; frontend de GitHub Pages não cria o backend automaticamente.
- **Teste sem dados reais:** GitHub Actions em 19/11/2026, execução `44626731240`, **sucesso** nos testes de layout (320/390/430 px) e sincronização simulada de dois aparelhos, incluindo módulo 4, Português, Engenharia, reversão, sessões e exclusão. Implantação Pages do mesmo commit `377c3fd4c02c` também teve sucesso. O teste usa API Supabase simulada, não substitui Auth e RLS reais.
- **Estado:** **frontend preparado/publicado; sincronização remota ainda DESATIVADA.** O Supabase não foi conectado nem configurado pelo usuário. Não afirmar sincronização automática operacional até testes reais com duas contas e dois aparelhos.

## 19/11/2026 — Supabase criado e conexão pública configurada

- Usuário autorizou criação do projeto **Concurso Estudos** na única organização Supabase da conta; custo informado pela plataforma: **0 por mês**, plano Free. Projeto `wksjkelogtwmktbocdmc`, região `sa-east-1`, status `ACTIVE_HEALTHY` verificado.
- Aplicada migração `concurso_private_sync_rls`: tabela `public.concurso_sync_items`, RLS habilitado e quatro políticas por `auth.uid() = user_id`. Consultas verificaram acesso `anon` negado, `authenticated` permitido com RLS; advisors de segurança sem alertas na checagem.
- `assets/sync-config.js` recebeu somente URL pública de API e chave **publishable**; nenhuma chave administrativa ou progresso pessoal foi incluído. A UI `conta.html` agora permite tentar cadastro/login; integração remota pronta para teste pelo próprio usuário.
- Teste automatizado GitHub `44634120562` aprovado (navegação mobile e sincronização simulada). **Pendente:** confirmar criação/login por e-mail reais; definir Site URL/redirecionamentos em Authentication/URL Configuration no painel Supabase se a confirmação por e-mail exigir; verificar uso real em computador e celular, conflitos e backup. Não presumir marcações efetivamente transferidas antes de login em ambos.

## 19/11/2026 — Simplificação solicitada: sem contas nem e-mail

- Pedido explícito do usuário: único utilizador; remover cadastro por e-mail e confirmações. Substituído o login por **link/código privado de pareamento** entre computador e celular.
- Backend: Supabase Edge Function `concurso-pareamento` com `verify_jwt=false` e verificação **própria obrigatória** do SHA-256 de um código aleatório de 256 bits em cabeçalho HTTPS. Chave pessoal não publicada no GitHub. Banco `public.concurso_pair_items` com RLS e zero permissões/políticas para navegador anônimo; o backend privilegiado é o único caminho de acesso.
- Frontend: `conta.html` agora é página de vínculo sem conta. `assets/sync.js` armazena código apenas no navegador e sincroniza com a Edge Function. Link `#vincular=` é retirado da barra de endereço após abertura; botão para copiar vínculo ao segundo dispositivo.
- Conserva leitura de RLM, Engenharia, Português; tarefas, disponibilidade, questões e revisões. Progresso legado não é reclassificado como estudado. Manual atualizado: `docs/SINCRONIZACAO_PRIVADA.md`.
- CI dos dois navegadores simulados e layout mobile aprovado no commit `651604210212`; Pages deploy do mesmo commit concluído.
- **Pendente de confirmação empírica:** o proprietário abrir o vínculo privado em ambos os aparelhos e confirmar status `Sincronizado`; verificar transferência real do módulo 4 e reversão. O código de pareamento deve ser mantido em segredo. Quem tiver o código consegue acesso ao progresso.

## 19/11/2026 — Atualização adaptativa por hora (automação de navegador)

- **Pedido:** recalcular painel, aulas, planejamento e sugestões a cada hora, usando leitura declarada, tarefas efetivamente realizadas, avaliações registradas e revisões, sem inventar domínio.
- **Implementado:** `assets/adaptive.js` + `assets/adaptive.css`, carregados em `index.html`, `aulas.html`, `planejamento.html`, `progresso.html`, `revisoes.html` e nas três aulas publicadas. O painel recomenda a próxima seção ainda não marcada como Lido e exibe justificativas por peso do edital e por avaliações efetivamente registradas. Se houver revisão vencida baseada em erros da mesma prova, ganha prioridade.
- **Fonte pública:** seção `adaptive_study` de `dados/concursos.json`, com URLs, distribuição real das 71/37/21 subseções por módulo e títulos fiéis às aulas; prioridade e pesos derivam das matrizes de CASAN e IMA já cadastradas. A mudança de concurso por janela não marca aproveitamento do concurso anterior como resultado do novo.
- **Sinais privados:** leitura de RLM/Engenharia/Português, dias disponíveis, atividades `ce_plan_done_v1`, questões `ce_question_logs_v1`, revisões `ce_review_done_v1` já sincronizados pelo mecanismo de pareamento do Supabase. Nenhum valor pessoal foi adicionado ao repositório público.
- **Frequência revisada:** o recálculo de sugestões LOCAIS ocorre ao abrir/retomar a aba, após marcar Lido ou sincronizar, ou quando o usuário solicita. A manutenção EDITORIAL real de aulas, planos e GitHub ocorre na automação horária do ChatGPT criada posteriormente; não depende de o site estar aberto. A automação pode falhar por permissões/cotas e deve informar execução verificada.
- **Painel/planejamento:** os links `dynamicFocusLink` e `nextLessonLink` são ajustados à recomendação efetiva, sem apagar a prioridade documentada nem as atividades do calendário. A agenda continua com marcação manual reversível. As aulas recebem uma caixa não intrusiva com o primeiro ID não lido e atalho para retomar; conteúdo teórico e IDs não são alterados.
- **Sem inferência:** não se converte Lido em Estudado, nem cronograma em trabalho realizado, nem avaliação CASAN em resultado IMA. Revisões sugeridas não são marcadas feitas. Não gera conteúdos novos automaticamente e não edita os .md privados da Biblioteca.
- **Verificação concluída:** `scripts/verificar-adaptacao.mjs` usa somente dados sintéticos em Chromium (CASAN por peso, 8.1, três aulas, planejamento, revisão vencida, intervalo horário e mobile). O CI de testes de navegador, leitura mobile e sincronização simulada terminou com **sucesso** na execução GitHub Actions `44648482038` (commit `b42484d93463`); o deploy do GitHub Pages do mesmo commit concluiu com **sucesso** em `44648481003`. Não equivale a testar continuamente navegadores físicos ou atualização com site fechado.

## 19/11/2026 — Manutenção editorial por tarefa do ChatGPT (não navegador)

- **Pedido do proprietário:** uma TAREFA AGENDADA DO GPT de hora em hora para CONSULTAR progresso privado Supabase e atualizar de fato GitHub Pages: criar aulas futuras, revisar as publicadas, verificar conteúdo vazio/incompleto, melhorar fórmulas e legendas, ordenar estudos e recomendações por edital/prazo, executar testes e registrar próxima aula. NÃO confundir com o cálculo local do painel.
- **Automação criada e ativada:** `Manutenção horária Concursos` (ID operacional registrado internamente na tarefa ChatGPT). Agendamento `RRULE:FREQ=HOURLY`, fuso `America/Sao_Paulo`. Executa a cada hora conforme disponibilidade do serviço. A criação da tarefa não garante publicação em cada rodada; só afirmar mudanças quando commits, validação e deploy forem verificados. Ela deve usar GitHub/Supabase/Library com permissões efetivamente disponíveis e preservar privacidade.
- **Navegador:** `assets/adaptive.js` continua calculando sugestões imediatas ao abrir, mudar marcação ou sincronizar, sem executar tarefa editorial por temporizador. Não gera nem publica aula sozinho. O texto do site foi alterado para distinguir as duas responsabilidades.
- **Regra nova de aula:** controles individuais `Lido` no FINAL do conteúdo teórico da subseção (após exemplos, macetes e alertas), reversíveis e com IDs legados preservados; `assets/lesson-end-reading.js` move os controles existentes para o fim em 71+37+21 subseções e `assets/lesson-enhancements.css` fornece rodapés responsivos. Verificar sem JS e com JS nos novos materiais e preferir HTML nativo com botão no fim desde a autoria.
- **Fórmulas:** não colocar expressão importante sem explicação em linha isolada; usar quadro destacado com termo geral, condições de validade, legenda de todos os símbolos, resolução passo a passo e verificação. Melhoradas PA/PG nos tópicos RLM 9.1–9.4 e 11.8–11.9: termo geral, soma, condição q≠1 e exemplos corretos. Preservados 71 IDs de RLM.
- **Auditoria contínua:** manter validação de subseções vazias em `scripts/verificar-conteudo-rlm.mjs` e dos rodapés em `scripts/verificar-lido-final.mjs`; auditar também Engenharia e Português durante as rodadas antes de publicar. Não rotular aula disponível como estudada automaticamente. Ordenação pessoal precisa ser derivada de sinais privados em tempo de execução (não publicar histórico pessoal em JSON público).
- **Limitação:** Biblioteca privada `.md` não sincroniza automaticamente com o site; alterar no GitHub não edita tais documentos. Se um agente/tarefa não tiver acesso real, reportar e não fingir atualização.

## 19/11/2026 — Auditoria de seções e ciclo de qualidade (execução confirmada)

- **Norma para toda nova aula e revisão:** `docs/PADRAO_AULAS_E_ROTEIRO.md` (Lido no final, fórmulas em quadros completos com legenda, prova de exemplo, índice, continuidade e privacidade); deve ser lida em cada manutenção editorial horária do GPT.
- **Verificação inicial em três aulas (129 subseções):** a auditoria de conteúdo detectou 11 subseções com explicação insuficiente (5 RLM, 6 Engenharia/Qualidade); elas receberam conceitos, exemplos trabalhados e alertas, mantendo IDs e estados. As seções de Português tinham texto suficiente segundo o teste.
- **Auditoria após correções:** `scripts/auditar-conteudo-aulas.mjs` passou com **zero seções críticas/vazias**. Há **24 trechos ainda concisos**, 13 em RLM e 11 em Engenharia, sinalizados para avaliação editorial nas próximas execuções; conteúdo curto não é automaticamente incorreto.
- **Posição dos controles de leitura:** `scripts/verificar-lido-final.mjs` validou no DOM 71/37/21 controles Lido após o conteúdo; a formatação das seis caixas PA/PG (9.1–9.4 e 11.8–11.9) também passou. O controle original foi deslocado, preservando listeners e armazenamento.
- **Ordenação adaptativa:** `assets/adaptive.js` passou a ordenar cartões do catálogo no navegador conforme edital, disponibilidade de aula e leitura não concluída, com link de retomar a próxima etapa. Nenhum resultado pessoal foi colocado no HTML público.
- **CI confirmado:** GitHub Actions `44650589493` (commit `fd5e6168f5c0`) concluído com **sucesso** em todos os testes, inclusive mobile, auditoria, sincronização simulada e recomendações. GitHub Pages `44650589069` do mesmo commit concluiu com sucesso. O material público já refletia as 11 ampliações nesse deploy.
- **Novas aulas futuras:** ainda não foi publicada aula nova nesta rodada; a tarefa horária do GPT deverá criar materiais a partir das lacunas e prioridades que verificar, publicando somente após conclusão do HTML e do teste. Não confundir material planejado com disponível.

## 20/11/2026 — Primeira passagem manual da manutenção horária (fila de 5 equivalentes)

- **Regra operacional privada da automação:** manter em qualquer rodada pelo menos 5 aulas completas equivalentes ainda não lidas. Para aula completa publicada e pertinente ao edital ativo, considerar `(subseções totais - subseções Lido) / subseções totais`; somar em todos os materiais válidos, sem duplicar conteúdo ou contar rascunhos. **Nunca publicar no GitHub números pessoais de leitura nem usar calendário como prova de estudo.**
- **Automação ChatGPT:** tarefa `Manutenção horária Concursos` atualizada e acionada uma vez manualmente; segue com `RRULE:FREQ=HOURLY`. A cada rodada, deve usar as conexões Supabase/GitHub disponíveis, contar reserva real, criar novas aulas completas se necessário, auditar as existentes, pesquisar exemplos/questões de fonte verificável e publicar com testes.
- **Novas aulas completas:** `aulas/banco-dados.html` (modelagem, normalização, SQL, JOIN, ACID, índices e segurança SQL); `aulas/seguranca.html` (SQLi, XSS, CSRF, OAuth, PKCE, JWT, REST, DevSecOps); `aulas/algoritmos-oo.html` (Big-O, estruturas, OO, SOLID, padrões, testes). Cada aula tem 3 módulos, 9 subseções, teoria com exemplos resolvidos, índice e controle Lido reversível no FIM de cada etapa, três questões didáticas **autorais** com correção por `assets/quiz.js`. Não atribuir questões à banca sem fonte.
- **Catálogo e navegação:** seis aulas catalogadas em `aulas.html`, todas ordenadas por prioridade/peso/pendência de leitura via `assets/adaptive.js`. Links de retomada levam à primeira seção não lida. Painel `index.html` possui atalhos para as novas aulas. A configuração pública de estrutura e módulos fica em `dados/concursos.json` e nenhum progresso pessoal é commitado.
- **Persistência:** `assets/new-lesson.js` mantém marcações individuais e backups JSON por nova aula; `assets/sync.js` reconhece `read:new:<slug>:<id>`; Edge Function Supabase `concurso-pareamento` implantada com whitelist desses IDs, mantendo código privado de acesso **apenas no backend e no dispositivo**. Backup geral no painel atualizado para versão v6, preservando importação das versões v1–v5 e integrando leitura das novas aulas e confirmação manual da inscrição.
- **Engenharia/Qualidade corrigida:** removidos avisos estáticos desatualizados que impunham RLM 6.1 como foco na página de Engenharia, incompatíveis com a adaptação à leitura real; substituído chip 'Sem questões' por 'Questões autorais ao final', adicionado quiz autoral de 3 itens com explicações. Os 37 botões Lido foram movidos para após o conteúdo no HTML, sem depender de reposicionamento dinâmico e preservando IDs/armazenamento. `assets/lesson-end-reading.js` reconhece os rodapés nativos, sem duplicá-los.
- **Inscrição IMA:** aviso do período de inscrições registrado (13/11–14/12/2026), link FURB e botão reversível de **confirmação manual** no painel, plano, catálogo e aulas. Até declaração explícita, aparece 'inscrição não confirmada'; inscrição/pagamento/homologação NÃO são inferidos. `ce_registration_v1` é armazenado localmente e pode sincronizar pelo endpoint privado `registration:ima`, sem publicar o estado individual no repositório.
- **Testes:** ampliados `scripts/verificar-mobile.mjs`, `scripts/verificar-lido-final.mjs` e `scripts/auditar-conteudo-aulas.mjs` para as 6 aulas / 156 subseções, além de `scripts/verificar-adaptacao.mjs` (fila de 5) e `scripts/verificar-sincronizacao.mjs` (novas aulas e inscrição). Confirmar link do GitHub Actions/Pages da última publicação antes de declarar sucesso.
- **Pendências editoriais:** trechos concisos sinalizados na auditoria de densidade textual (requerem avaliação didática, não implicam erro); questões reais da mesma banca/cargo só devem ser adicionadas se fonte/caderno e gabarito oficial forem verificáveis. Material publicado não é material estudado. A Biblioteca privada do Projeto não se atualiza por commit público.

## 19/11/2026 — Unificação visual de todas as aulas (manutenção horária)

- **Padrão único:** seis páginas (RLM, Engenharia/Qualidade, Português, Banco de Dados, Segurança, Algoritmos/OO) agora incluem `assets/lesson-unified.css` e `assets/lesson-unified.js`. O padrão de referência é RLM: cabeçalho, índice, progresso por subseção, hero, módulos, exemplos e Lido reversível ao fim. IDs e chaves de progresso originais preservados.
- **Limpeza de interface:** retirado o carregamento de `assets/adaptive.js` e `assets/registration.js` de cada HTML de aula, de modo que sugestões locais e avisos administrativos não interrompam a leitura. Os avisos de inscrição devem continuar no painel e planejamento, não dentro das aulas.
- **Ferramentas:** controles de backup e preferências existentes são transferidos para `<details id="ferramentas-da-aula">` no fim da página, recolhido inicialmente; a marcação individual Lido continua disponível junto à subseção. Engenharia não mostra mais, antes do conteúdo, os blocos 'Como usar esta aula' e 'Registro de leitura (não é avaliação)'.
- **Testes:** `scripts/verificar-padrao-aulas.mjs` e sua integração ao CI foram adicionados. Verificar a execução de GitHub Actions e publicação Pages antes de declarar a implantação concluída. Revisão visual manual em aparelho físico ainda não foi feita.
- **Próxima passagem:** verificar resultados do CI e corrigir regressões reais, especialmente foco de teclado, layout móvel e importação/exportação após a movimentação dos controles; aprofundar subseções concisas. Não gerar novas aulas enquanto a reserva de cinco aulas equivalentes permanecer atendida. Reconsultar progresso no Supabase a cada execução, sem publicá-lo.

## 19/11/2026 — Identidade visual unificada das seis aulas

- **Pedido explícito:** todas as aulas devem usar o padrão visual/estrutural da RLM; eliminar "Sugestões locais" dentro das aulas e blocos administrativos de abertura como "Registro de leitura (não é avaliação)". O site deve permitir **ler** em vez de exibir instruções sobre sua implementação.
- Implementado `assets/lesson-unified.css` com identidade compartilhada de cabeçalho, índice, hero, módulos, subseções, controles finais e cores sem sacrificar contraste; `assets/lesson-unified.js` recolhe configurações, preferências e backup em `<details>` ao fim, sem recriar controles nem alterar chaves/IDs.
- Aplicado nos seis arquivos: `aulas/rlm.html`, `aulas/engenharia-qualidade.html`, `aulas/portugues-casan-19-11.html`, `aulas/banco-dados.html`, `aulas/seguranca.html` e `aulas/algoritmos-oo.html`.
- Removido o cliente `assets/adaptive.js` **apenas das páginas de aula**: as recomendações permanecem disponíveis no painel, catálogo e planejamento; a tarefa horária real do ChatGPT continua responsável pela manutenção editorial. Banners de inscrição continuam no painel/planejamento, não na leitura da aula.
- Removidos de Engenharia o aviso introdutório redundante e a etiqueta "Registro de leitura (não é avaliação)", substituído cabeçalho datado. Removidas notas administrativas iniciais de RLM e Português. Os backups e marcadores foram PRESERVADOS.
- Corrigido `assets/new-lesson.js` para tratar aulas sem leitura anteriormente salva (não acessar `.read.filter` de registro inexistente).
- Adicionado `scripts/verificar-padrao-aulas.mjs` ao workflow para validar seis aulas em 320/390/430/1280px, topo/índice/hero, ausência dos banners administrativos, backups em detalhes, fluxo e erros JS. Corrigido teste `scripts/verificar-adaptacao.mjs` para exigir sugestões somente no painel/planejamento.
- Testes GitHub Actions **aprovados** em `44656792190` no commit `5945c2d9afef`, incluindo 156 controles Lido finais e sincronização simulada. Implantação Pages desse commit também **aprovada** em `44656791476`. A norma permanente foi atualizada em `docs/PADRAO_AULAS_E_ROTEIRO.md` e a automação horária existente também recebeu requisito de identidade única. Nenhum progresso pessoal foi publicado no repositório.

## 19/11/2026 — Painel inicial sem Sugestões locais redundantes

- A pedido do usuário, a página inicial **não** apresenta mais a caixa automática `Sugestões locais`; mantém seu próprio card de próximo foco, atalho dinâmico, progresso e acesso ao planejamento.
- `assets/adaptive.js`: `createPanel()` não injeta seção redundante em `index.html`, mas `render()` continua atualizando `dynamicFocus`, `dynamicFocusLink` e os atalhos de retomada mesmo sem criar a caixa. No planejamento, o nome visível passa a ser **Continuidade do plano de estudos**; a recomendação útil permanece.
- `scripts/verificar-adaptacao.mjs` cobre ausência de caixa na home, atualização de foco dinâmico, painel no planejamento e ausência de sugestões intrusivas dentro das aulas. Isso não interfere na tarefa horária editorial do GPT nem na sincronização Supabase.

## 19/11/2026 — Simplificação definitiva de interface: sem aba Progresso nem Sugestões locais

- A pedido do proprietário, não exibir mais a caixa `Sugestões locais` **em nenhuma página**. `assets/adaptive.js` continua processando leituras, ordenando catálogo e atualizando os links de próximo foco no painel/planejamento, mas não injeta nova caixa de recomendações. A manutenção editorial horária continua sendo tarefa do GPT, não do navegador.
- A área autônoma `Progresso` foi retirada dos menus de Início, Aulas, Planejamento, Revisões, Sincronização e das aulas novas/Português; o atalho em cartões do início e a caixa redundante `Salvamento automático` foram removidos. A URL antiga `progresso.html` redireciona para `aulas.html`, sem executar exclusão de dados.
- Progresso privado continua persistido e sincronizado: **não apagar dados, chaves localStorage, tabela Supabase, registros de questões ou revisões**. Manter indicadores de leitura **dentro das aulas**, necessários para saber o que falta ler.
- Backup geral JSON foi transferido para uma seção opcional recolhida na página `conta.html`, mantendo compatibilidade com o motor existente `assets/site.js`. Não exibir página isolada de progresso como pré-requisito para sincronização.
- Atualizados query strings dos scripts para impedir cache do JavaScript antigo. Testes `scripts/verificar-adaptacao.mjs` validam ausência das caixas e da aba, redirecionamento antigo e backup preservado.
- **Regra para manutenções futuras:** não reintroduzir os elementos removidos. Usar painel, planejamento e aulas como interface mínima de estudo; manter meta de 5 aulas equivalentes conforme progresso privado na tarefa agendada.
