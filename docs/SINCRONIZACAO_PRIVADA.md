# Sincronização privada: ativação e limites

**Situação:** o frontend de sincronização e o SQL de segurança foram preparados no repositório. **Não há serviço remoto operacional enquanto o projeto Supabase não estiver configurado e validado.** Não confundir frontend publicado com sincronização ativa.

## Ativação (configuração autorizada separadamente)

1. Criar/conectar um **projeto Supabase privado** e habilitar Auth por e-mail/senha com confirmação de e-mail. Usar a mesma conta em computador e celular.
2. Executar `supabase/schema.sql` no SQL Editor desse projeto. Manter **RLS habilitado** para `public.concurso_sync_items`, somente com as políticas próprias que exigem `auth.uid() = user_id`. Realizar um teste de isolamento com duas contas antes de habilitar no site.
3. Na configuração de URL / Authentication do Supabase, definir Site URL para `https://andrewmoreira02.github.io/concurso-estudos/` (para confirmação por e-mail, se necessário).
4. Inserir em `assets/sync-config.js` **apenas** a URL HTTPS de projeto e a chave pública `sb_publishable_...` (ou `anon`). **NUNCA** salvar `service_role`, chaves `sb_secret_...`, senha, JWT, e-mail pessoal ou URL administrativa no repositório.
5. Confirmar no GitHub Pages que `conta.html` oferece login, faça cadastro/confirmação, entre e valide em dois navegadores distintos. Antes da primeira conexão, exportar backup JSON do painel em cada dispositivo.
6. Testar marcação **e desmarcação** da mesma subseção nos dois navegadores, além de planejamento e histórico de questões, verificando RLS e ausência de mistura entre contas.

## Modelo implementado

- Frontend do site: `assets/sync.js`, sem SDK de terceiros. Autenticação via HTTPS em `/auth/v1`; sessões podem ser restauradas por refresh token salvo no navegador. A senha não é persistida no navegador pelo código.
- Banco: `public.concurso_sync_items` com chave composta `(user_id,item_key)` e `payload` JSON, acesso `select/insert/update/delete` exclusivo ao usuário autenticado via Row Level Security.
- Dados: controles por subseção (RLM, Engenharia, Português), agenda marcada, dias disponíveis, sessões de questões, conclusões de revisão e preferência de marcação ao avançar de Português. **Não** publica histórico ou respostas em GitHub. Dados legados por módulo não viram marcação de subseção.
- Conciliação inicial: união conservadora de itens marcados como lidos/atividades confirmadas em dois dispositivos, sem converter marcação `Lido` em `Estudado`. Sessões de questões unem-se por identificador e nunca se somam como novas tentativas.
- Depois da primeira sincronização, alterações explícitas de marcação e reversão geram registro por item. Sem internet, as mudanças locais são preservadas para posterior sincronização.
- Confirmação de alterações remotas: se as marcações em uma aula forem alteradas a partir de outro dispositivo, a página recarrega automaticamente para reconstruir contadores/controles, sempre que não houver edição de formulário em curso. Uma alteração concorrente exata pode ser resolvida pelo último envio; o backup JSON é um recurso de segurança.
- Tokens de sessão ficam em `localStorage` no próprio aparelho; somente usar HTTPS, manter scripts revisados e não usar computadores compartilhados. Encerrar a sessão em aparelhos públicos.
- A sincronização **não** sincroniza arquivos privados da Biblioteca ChatGPT, e não interpreta leitura como estudo ou domínio. Não atualiza estado privado do concurso automaticamente.

## Critérios de aceite pendentes de integração real

- [ ] Supabase conectado, SQL executado, RLS testado com duas identidades.
- [ ] `assets/sync-config.js` configurado apenas com URL e chave pública.
- [ ] Cadastro/login/logout/renovação de sessão verificados no serviço.
- [ ] Teste ponta a ponta de leitura (incluindo módulo 4), marcação reversível, disponibilidade, questões e revisões em dois aparelhos.
- [ ] Verificação de mudanças simultâneas/offline e restauração de backup.
- [ ] Testes de Chrome/Safari mobile reais e anúncio do serviço como operacional apenas após verificação.
