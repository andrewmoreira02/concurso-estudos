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

## 19/11/2026 — Questões explícitas no sábado e automação integral de revisões

- **Problema detectado:** o planejamento de sábado 21/11/2026 continha só “revisão leve — TI e Atualidades”, sem exercícios/quiz agendados; o plano futuro IMA mencionava revisões genéricas; a página `revisoes.html` exigia formulário manual de questões e resultados, mesmo após quizzes corrigidos.
- **Calendário corrigido:** `dados/concursos.json` inclui sábado **21/11** o bloco `questions-reta-final` (15 questões/≈35 min) e `revision` (revisões automáticas quando houver erros). No IMA foram adicionadas sessões `ima-questions` às quartas e sábados do ciclo — somente quando dia fizer parte do planejamento, sem presumir execução — com ajuste do bloco de TI para manter as 2 horas do núcleo sugerido. A véspera do IMA 13/02/2027 contém treino leve e revisão; não é confirmação de prova ou comparecimento.
- **Banco de questões:** `dados/questoes.json` com 29 questões autorais claramente rotuladas, 15 selecionadas para a véspera CASAN (TI 8, Português 3, RLM 2, Legislação 1, Atualidades 1). Questões jurídicas/ambientais são conceituais, NÃO alegam transcrever lei interna ou fato noticioso do momento. Os temas do edital CASAN são baseados na matriz do plano e na página oficial do concurso `https://www.institutoaocp.org.br/concursos/711`. Pesquisar questões reais verificáveis de AOCP/FURB nas próximas passagens; não inventar procedência.
- **Treinos publicados:** `aulas/questoes-casan-21-11.html` e `aulas/questoes-ima.html` (este tem 12 questões de matérias compartilhadas TI/Português/RLM; faltam Administração Pública e Legislação Ambiental para cobertura específica IMA). Também adicionados links no `aulas.html` e foco do dia 21 no `assets/adaptive.js`. São provas práticas, NÃO contam como aulas completas na meta das cinco equivalentes.
- **Questões respondidas:** `assets/quiz.js` agora corrige simulados de várias disciplinas e salva resultados por disciplina e edital, com `questionIds` e `wrongQuestionIds` somente após envio; publica eventos para a sincronização Supabase. Não classifica automaticamente causa do erro; não inventa acertos.
- **Revisões AUTOMÁTICAS:** `revisoes.html` foi reconstruída sem `practiceForm`, data, assunto, acertos ou qualquer campo manual de registro. `assets/practice-auto.js` produz, a partir de sessões com erros, uma fila por data +1/+3/+7 e quizzes de recuperação usando o banco. O envio de respostas do quiz marca a revisão como **praticada**, gerando uma nova sessão; abrir página ou rolar NÃO marca. Falhas de armazenamento preservam pendência, não simulam sucesso.
- **Compatibilidade e privacidade:** sessão antiga salva, logs, revisões e backups permanecem nas mesmas chaves privadas `ce_question_logs_v1` / `ce_review_done_v1`; não publicar resultados no GitHub. Mantido `assets/sync.js`/Supabase com seu modelo de acesso; não misturar resultados entre CASAN e IMA. Na página inicial, o cartão **Revisões automáticas** explica o fluxo.
- **Validação automatizada:** `scripts/verificar-pratica-automatica.mjs` usa Chromium, data simulada 21/11, envia 15 questões gerando cinco sessões, confirma 13/15 simulados (NÃO resultados pessoais), produz e responde revisão, registra treino de 12 itens do IMA e valida quiz legado. GitHub Actions 44660503018 e 44660608400: **todos os jobs aprovados**. Pages 44660607952: **implantação aprovada**. Testes automatizados não são observação de dispositivos físicos.
- **Pendência editorial:** elaborar questões específicas do IMA para Administração Pública/Legislação Ambiental, aferir edital e curadoria de provas reais verificáveis; aprofundar justificativas das alternativas e conferir respostas. Não reintroduzir formulário manual de sessão no site.

## 19/11/2026 — Prioridade de questões REAIS, após correção explícita do usuário

- **Falha corrigida:** o primeiro banco de 29 questões autorais não havia sido antecedido pela pesquisa obrigatória de provas anteriores. Preservado como **reserva** para lacunas, nunca como padrão quando houver questão real com gabarito verificável.
- **Fonte REAL verificada:** FURB — Concurso Público Técnico-Administrativo, Edital 002/2023, cargo **Analista de Sistemas**. Página do concurso: https://concursos.furb.br/informacoes/282/ . Caderno de questões (espelho de prova original, identificado por banca/cargo/ano): https://arquivos.qconcursos.com/prova/arquivo_prova/97697/furb-2023-furb-sc-analista-de-sistemas-prova.pdf . Gabarito **FINAL oficial** FURB de 05/10/2023: https://anexos.cdn.selecao.net.br/uploads/342/concursos/282/anexos/EJyjPmlrUv3kWaqnwJwxPvqDnf1sK2KHAhYVKK6L.pdf . Questões **14 e 32 anuladas**, excluídas.
- **Curadoria publicada:** `dados/questoes-reais.json` contém 17 itens originais reais, com número, página, área, tema, resposta do gabarito final, URLs de prova e gabarito e explicação didática. Não reproduzir a redação integral de questões de terceiros sem licença: o frontend mostra uma descrição curta e link para consultar o PDF original na página certa, permite responder A–E *tal como na prova* e corrige pelo gabarito publicado. Não chamar descrição curta de enunciado original nem adaptação não autorizada de questão real.
- **Treino CASAN de 21/11:** 15 itens = **13 reais FURB 2023 + 2 autorais** para Legislação e Atualidades não contempladas nesse caderno. FURB é OUTRA banca e portanto permanece opção subsidiária: prioridade futura é AOCP caderno e gabarito oficial confirmados. Foi identificado caderno AOCP 2025 Analista TI Joinville (https://arquivos.qconcursos.com/prova/arquivo_prova/149463/instituto-aocp-2025-prefeitura-de-joinville-sc-analista-de-tecnologia-da-informacao-prova.pdf), mas **ainda não foi possível confrontar um gabarito final oficial correspondente**; não incluí-lo como item real corrigível até validação. NÃO atribuir questões FURB à AOCP.
- **Treino IMA:** 12 reais FURB 2023, cargo TI similar, banca correspondente; não cobre matérias exclusivas de Administração Pública e Legislação Ambiental. Uma mesma questão pode servir à aprendizagem, mas resultados continuam separados CASAN/IMA.
- **Sistema:** `assets/practice-auto.js` lê `dados/questoes-reais.json` ANTES da reserva `dados/questoes.json`, seleciona as questões reais primeiro para simulado e revisões, usa botão de abrir PDF por questão e mantém letras A–E originais; `assets/quiz.js` continua registrando somente respostas enviadas e revisão automática por erros. `scripts/verificar-pratica-automatica.mjs` deve confirmar 13+2 sábado, 12 reais IMA, fontes/páginas corretas, gabaritos, separação de resultados; CI executa nos pushes do banco real. `aulas/engenharia-qualidade.html`, `aulas/banco-dados.html` e `aulas/algoritmos-oo.html` agora exibem referências a provas reais verificadas antes de suas questões autorais complementares.
- **Próximo trabalho de curadoria:** localizar caderno + gabarito final verificáveis da AOCP para cargo TI/analista, depois substituir as questões FURB no treino CASAN por AOCP alinhadas ao edital quando possível, sem inventar fontes. Ampliar banco FURB IMA em Português, Administração Pública e Legislação Ambiental conforme edital vigente. Aplicar mesma ordem a todas as aulas novas e manutenções horárias. Não reproduzir integralmente itens protegidos por copyright.

## Critério de curadoria de questões — manutenção editorial

Antes de adicionar questões ao treino, pesquisar caderno e gabarito **final** de provas anteriores, na ordem: mesma banca e cargo; mesma banca e área; outras bancas e conteúdo equivalente; autorais apenas para lacunas comprovadas. Para CASAN, priorizar Instituto AOCP; para IMA-SC, FURB. Identificar órgão, banca, cargo, ano, número da questão, URL do caderno, gabarito final, eventual anulação e aderência ao edital. Sem confirmação do gabarito final, a questão não entra no quiz corrigível como real. Questões adaptadas exigem rótulo explícito e alternativas reescritas; questões autorais antigas ficam como reserva. Não reproduzir integralmente material protegido: preferir link para caderno e referência à questão. Não publicar nesta documentação contagens individuais de leitura ou avaliação.

Fontes candidatas ainda sujeitas à validação individual: FURB Analista de Sistemas 2023 (caderno e gabarito final já utilizados nos treinos); Instituto AOCP Joinville 2025 Analista de TI (gabarito final pendente de conferência); FURB Auditor Fiscal Florianópolis 2025, área de TI (conferir caderno, gabarito e aderência por item). Revisar a proporção de reais/adaptadas/autorais por bloco e excluir questões anuladas.


## 20/11/2026 — Correção editorial de classificação dos simulados

- `dados/concursos.json`: descrições do treino CASAN de 21/11 e das sessões IMA corrigidas para **questões adaptadas** (13 CASAN, 12 IMA), com enunciado e alternativas na página, gabarito próprio da adaptação e PDF da prova original como referência opcional. As 2 questões autorais da CASAN permanecem identificadas. Não rotular adaptações como questões originais da banca nem aplicar automaticamente a letra do gabarito original à adaptação.
- Próxima manutenção prioritária: ampliar a reserva de aulas completas elegíveis quando a fração não lida cair abaixo de 5, sem expor contagens privadas em commits; conferir publicação no Pages, execução de `scripts/verificar-avanco-lido.mjs`, `scripts/verificar-pratica-automatica.mjs` e inspeção renderizada em 320/390/430 px.
- Esta correção não altera gabaritos, questões, marcações de leitura, avaliações ou revisões e não representa confirmação de deploy.


## 20/11/2026 — Correção editorial do planejamento IMA
- Em `dados/concursos.json`, duas entradas do calendário IMA foram corrigidas de «Questões reais FURB 2023» para «Questões adaptadas de prova FURB 2023». A descrição já informava corretamente que os itens eram adaptados, com gabarito próprio. Nenhuma questão, resposta ou registro individual foi alterado.
- **Pendente prioritário:** desenvolver e publicar aula integral adicional pertinente aos editais vigentes, com catálogo e testes, para garantir margem de reserva de leitura. Não usar números privados de leitura neste documento público.
- **Pendente técnico:** confirmar deploy do commit de correção e regressões de 320/390/430 px; commit no repositório não é prova de implantação no Pages.

## 20/11/2026 — Aula específica de Administração Pública IMA
- Criada `aulas/administracao-publica-ima.html`: 3 módulos, 9 subseções numeradas, teoria de princípios/estrutura/poderes/atos/processo/agentes/licitações/controle, nove exemplos resolvidos, macetes e alertas. Identidade compartilhada via `assets/new-lesson.css`, `assets/new-lesson.js`, `assets/lesson-unified.css` e `assets/lesson-unified.js`. Controles individuais Lido ao fim de cada subseção; sem transferir resultados de CASAN.
- Catalogada em `aulas.html`, painel `index.html` e janela IMA em `dados/concursos.json`. Sem quiz nesta aula: não foi verificado um conjunto histórico FURB com gabarito final para Administração Pública e não se deve inventar origem nem priorizar questões autorais antes da curadoria.
- Verificações estáticas após commit: 9 artigos, 9 controles, 9 entradas de índice, IDs únicos, referências aos assets e 9 exemplos/alertas; JSON do planejamento válido. Testes de navegador nas larguras 320/390/430, fluxo completo de backup e confirmação do deploy Pages **ainda pendentes**. Não tratar commit como implantação confirmada.
- A reserva quantitativa pessoal deve ser calculada exclusivamente no relatório privado ao proprietário, não neste documento público.
- Próximo foco: conferir deploy e teste de navegador, verificar correspondência detalhada da aula com o edital IMA, aprofundar legislação estadual específica e pesquisar questões FURB com gabarito final antes de inserir quiz.

## 20/11/2026 — Cobertura de regressão da sétima aula
- Incluída `aulas/administracao-publica-ima.html` nos testes existentes `scripts/verificar-padrao-aulas.mjs` (320/390/430/1280 px, índice, hero, backup recolhido, ausência de painel interno e erros JavaScript) e `scripts/verificar-avanco-lido.mjs` (marcação da origem ao avançar, reversão e preferência desligável). Antes, os dois scripts verificavam apenas seis aulas, deixando a aula IMA recém-criada sem cobertura.
- Alteração limitada aos scripts de teste: nenhum HTML, progresso, quiz ou dado privado foi alterado. A execução automatizada em Chromium e a confirmação do Pages permanecem pendentes enquanto não houver ambiente de navegador com acesso ao repositório; não declarar testes aprovados apenas pela alteração do código.
- Próximo foco: executar os dois scripts no CI, corrigir eventuais regressões, validar visualmente a sétima aula e conferir implantação no Pages antes de considerá-la disponível para o cálculo definitivo de reserva.


## 20/11/2026 — Manutenção de regressão das sete aulas
- Workflow `.github/workflows/validar-mobile.yml`: eliminada entrada duplicada de `dados/questoes-reais.json` nos filtros de push/PR e corrigidos os nomes dos testes de padrão visual e avanço `Lido` de seis para **sete** aulas, refletindo a inclusão de Administração Pública IMA. Nenhuma alteração de lógica de estudo ou progresso.
- A execução de navegador, a conclusão do CI e o deploy do Pages precisam ser verificados separadamente; a existência dos testes ou o commit não comprova sucesso de execução.
- Próximo foco: conferir logs das regressões e disponibilidade pública; auditar visualmente Engenharia, preservar IDs e priorizar conteúdo de edital e questões verificadas sem repetir trabalho editorial sem evidência.


## 20/11/2026 — Correção factual do catálogo
- `aulas.html`: contador textual corrigido de seis para sete aulas catalogadas; as chamadas dos dois simulados foram corrigidas para **13 questões adaptadas + 2 autorais** (CASAN) e **12 adaptadas** (IMA). Retiradas alegações incorretas de reprodução integral de questões reais e de gabarito oficial como resposta das adaptações. Referência à prova de origem permanece opcional.
- A correção é editorial e pública, sem dados de leitura, resultados ou pareamento. **Não altera** `dados/questoes*.json`, gabaritos, respostas ou registros privados.
- Próxima verificação: confirmar Pages para o commit do catálogo, executar regressões de navegador 320/390/430 px, auditar Engenharia visualmente e conferir se outras telas ainda chamam adaptações de originais. Não tratar commit como prova de deploy.

## 20/11/2026 — Correção de regressão de navegação IMA
- A execução de GitHub Actions `44731152031` identificou falha concreta em `scripts/verificar-avanco-lido.mjs`: a aula `aulas/administracao-publica-ima.html` não continha o contêiner final `#ferramentas-da-aula .ce-lesson-tools-content`, necessário para a preferência reversível de marcar Lido ao avançar.
- Correção no HTML: configurações e backup transferidos para `<details>` fechado por padrão, **depois dos módulos**, mantendo IDs e chaves existentes; o motor `assets/new-lesson.js` pode inserir a preferência nesse contêiner. Nenhuma marcação de leitura foi criada ou alterada no repositório.
- Próxima verificação: conferir o resultado da regressão e do deploy do commit de correção; executar inspeção visual do conteúdo de Engenharia e das sete aulas em dispositivos reais. Não considerar publicação confirmada apenas pelo commit.


## 20/11/2026 — Continuidade de leitura e auditoria visual de Engenharia
- **Regra de continuidade corrigida:** `assets/adaptive.js` não reduz mais automaticamente a pontuação de uma aula parcialmente lida abaixo de uma aula zerada com o mesmo peso. O bônus de continuidade considera apenas subseções marcadas como `Lido`, não presume avaliação nem domínio, e cessa quando a aula estiver integralmente lida. Revisões vencidas por erros continuam prioritárias.
- **Fila pública:** a sétima aula `administracao-publica-ima.html` foi integrada a `dados/concursos.json` e ao modelo adaptativo. Os links de painel, catálogo e planejamento receberam versão de cache atualizada; a página autônoma Progresso e caixas locais redundantes não foram reativadas.
- **Regressão:** `scripts/verificar-adaptacao.mjs` ganhou cenário sintético de Engenharia em andamento versus Banco de Dados zerado, retomada por subseção e saída da fila quando concluída. Não são usados registros pessoais no teste.
- **Auditoria visual renderizada:** capturas automatizadas da aula Engenharia em 320, 390 e 430 px, com pontos de início, meio e final, foram anexadas ao workflow. Detectados e corrigidos dois defeitos de apresentação: quebra de palavra em ações do cabeçalho e tabela de técnicas de teste com coluna pouco legível no celular. A correção é CSS responsivo em `assets/lesson-unified.css` e versão de cache no HTML; nenhum ID, marcação, questão ou conteúdo teórico foi redefinido.
- **Validação efetiva:** GitHub Actions `44767460526` **sucesso**; GitHub Pages `44767460306` **sucesso**, commit `a198dd3b`. As capturas da rodada `44766795688` estão disponíveis como artefato temporário `engenharia-visual-mobile`. Testes automatizados não equivalem a teste manual em aparelho físico.
- **Próximo foco:** CASAN, prova em 22/11, manter continuidade de Engenharia e revisões de erros; no ciclo IMA (desde 23/11), aprofundar Legislação Ambiental específica e curar provas FURB com gabarito final antes de acrescentar questões. Calcular frações individuais somente em execução privada; nunca registrar métricas pessoais neste arquivo público.


## 20/11/2026 — Aula de Legislação Ambiental IMA e curadoria AOCP
- **Recorte oficial:** edital FURB 001/2026, Anexo V, grupo de Analista de Controle Administrativo (ANA), aplicável a Analista de Informática: Constituição (art. 225), LC 140/2011, Lei 6.938/1981, Lei estadual SC 14.675/2009 (Títulos I e II) e Lei SC 17.354/2017. A versão para Analista de Controle e Fiscalização Ambiental (ANF) exige outras normas: não transplantá-la. Legislação Ambiental Aplicada representa 6 das 60 questões previstas.
- **Aula integral:** `aulas/legislacao-ambiental-ima.html`: três módulos e nove subseções com explicações, casos resolvidos, macetes e armadilhas, índice responsivo, controles Lido reversíveis no final, anterior/próxima, preferência de marcação ao avançar e backup. Sem copiar questões de bancas nem atribuir avaliação.
- **Integração:** oitava aula catalogada no painel e catálogo, cadastrada em `dados/concursos.json`; o dia de Legislação Ambiental no calendário do ciclo IMA aponta para o novo HTML. O cálculo da reserva passa a considerar os editais ainda ativos, não apenas o concurso priorizado no dia.
- **AOCP Joinville/2025:** fonte organizada em `dados/fontes-aocp-joinville-2025.json`; prova de Analista de Tecnologia da Informação, caderno 01, espelho do gabarito definitivo emitido pelo sistema AOCP em 23/12/2025. Questões 1, 5, 7 e 22 constam como anuladas; demais alternativas mapeadas. A base é **referência documental**, não quiz: tópicos por número, autorização para reprodução e pertinência ao edital CASAN ainda precisam ser conferidos. Nenhum enunciado ou alternativa original foi copiado.
- **Proporção de itens interativos nesta aula:** 0 originais reproduzidas, 0 adaptadas, 0 autorais de quiz. Os casos explicativos são didáticos e não geram registros de desempenho. Itens legados de treino permanecem preservados.
- **Foco imediato:** CASAN 22/11 — preservar continuidade de Engenharia e revisar provas AOCP com aderência e gabarito conferidos; após 23/11, priorizar TI (36/60), Legislação Ambiental (6/60) e Administração Pública (6/60) do IMA, com diagnóstico próprio sem transportar domínio. Atualizar o banco de questões apenas após checagem individual e de direitos autorais.
- **Segurança:** nenhum progresso pessoal, pareamento, inscrição, nota ou registro de revisão deve integrar commits ou páginas públicas. Verificações de CI/Pages exigem consulta específica às execuções posteriores ao último commit.


## 20/11/2026 — Aprofundamento editorial e mapeamento do caderno AOCP
- **Engenharia:** 12 subseções curtas receberam casos resolvidos, distinções de conceitos, verificações e alertas sem alterar os 37 IDs estáveis nem mover ou substituir controles de leitura; commit `f7d3758`.
- **RLM:** 13 etapas curtas receberam conferências e exemplos numéricos, incluindo frações, percentuais sucessivos, razão, proporcionalidade, juros, gráficos, conjuntos e média; nenhuma das 71 etapas foi renumerada; commit `dfc36f3`.
- **Prova anterior da banca:** `dados/fontes-aocp-joinville-2025.json` agora classifica individualmente as 50 questões AOCP Joinville/2025 (Analista de Tecnologia da Informação) por assunto e página do caderno; quatro anuladas (1, 5, 7, 22); 18 vínculos a aulas existentes. O gabarito utilizado é o definitivo disponibilizado por espelho do sistema AOCP. Conteúdo do caderno foi inspecionado em texto extraído; a captura visual integral do PDF não foi completada e permanece pendente para itens com imagens e fórmulas. Classificação `candidato_tematico_conferir_edital_casan` não significa comprovação de aderência integral ao cargo 404.
- **Curadoria e proteção autoral:** os itens 21–30 tratam predominantemente de legislação municipal de Joinville; não devem ser utilizados como se fossem legislação CASAN. A questão 48 envolve uma distinção conceitual entre cifra e assinatura digital, que exige revisão antes de virar item interativo. Não foi incluído texto protegido de enunciados/alternativas; 0 reproduções originais autorizadas, 0 adaptações novas e 0 autorais novas neste lote. Questões anteriores e dados privados permanecem intactos.
- **Regressão dedicada:** `scripts/verificar-curadoria-aocp.mjs` confere 50 números, letras/anulações, páginas, proibição de publicação de texto original, vínculos para IDs realmente existentes, 37/71 passos e os 25 acréscimos editoriais. Adicionado ao GitHub Actions. A execução e o deploy associados ao último commit devem ser verificados, não inferidos.
- **Próximo foco:** classificar com o Anexo de Conhecimentos Específicos do edital CASAN quais tópicos da prova AOCP Joinville são plenamente compatíveis; revisar visualmente itens com fórmulas/figuras e o caso DSA/assinatura; só então produzir questões adaptadas completas e com gabarito próprio. Para a prova de 22/11, evitar material extenso novo fora das lacunas; revisões vencidas e o simulado já existente têm prioridade. Reavaliar o foco para IMA a partir de 23/11, sem transferência de domínio.


## 20/11/2026 — manutenção pedagógica: exemplos de cobrança e aprofundamento
- Regras gerais de estudo e estados CASAN consultados na Biblioteca; repositório público e fontes FURB/AOCP previamente catalogadas consultados. O usuário solicitou uma área “Cobrado assim na prova” com 1–5 exemplos pertinentes, sempre com profundidade editorial e origem verificável.
- Engenharia: quatro subseções complementadas com exemplos resolvidos e armadilhas; RLM: quatro etapas complementadas com cálculos conferidos, preservando IDs, leitura, navegação e backup. Commits `fa8bc33` e `dd14e58`.
- Componente compartilhado `assets/lesson-unified.js` e CSS: área contextual em cinco aulas (Português, RLM, Banco de Dados, Algoritmos/OO, Engenharia). Carrega até cinco adaptações FURB/2023 já curadas por seção, alternativas completas, resposta própria e justificativa; origem com link opcional ao caderno. Não declara enunciado original reproduzido nem usa gabarito da questão de origem. Nenhum resultado é gravado por consultar esses exemplos. Commits `26faa0e`, `b749577`, `675798b`.
- Administração Pública e Legislação Ambiental IMA: não foi inventada questão real FURB sem curadoria de caderno e gabarito específicos. Próxima etapa: ampliar mapeamento verificado por disciplina e adaptar 1–5 exemplos relevantes em todas as áreas ainda sem cobertura, além de checar visualmente a inserção e os controles.
- Supabase autenticado `public.concurso_pair_items` consultado apenas para cálculo privado da fila; nenhum valor de leitura foi publicado em commits. Catálogo atual: 8 aulas completas (71, 37, 21, 9, 9, 9, 9, 9 subseções). A fila satisfaz o piso de cinco aulas equivalentes com o progresso sincronizado consultado nesta execução. Não alterar Lido para Estudado/Dominado.
- Limitação: commits foram aceitos, mas a verificação de GitHub Actions/Pages e renderização visual pós-implantação ainda é necessária. Não afirmar deploy confirmado sem inspeção.
