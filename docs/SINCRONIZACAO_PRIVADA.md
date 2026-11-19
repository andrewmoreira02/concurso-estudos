# Sincronização privada sem contas — Concurso Estudos

**Estado:** implementada no GitHub Pages; pareamento com código privado entre computador e celular, sem cadastro de e-mail, senha nem confirmação.

## Como vincular

1. No computador, exportar um backup JSON do painel antes do primeiro acesso, especialmente se o módulo 4 de RLM estiver marcado.
2. Abrir o link pessoal de pareamento entregue ao proprietário do site. É um link de `conta.html#vincular=...`; o trecho `#vincular` não vai ao servidor no carregamento e é removido da barra após leitura pelo JavaScript.
3. Aguardar a confirmação **Sincronizado**. Copiar **link para o celular** na página ou abrir diretamente o mesmo link privado no segundo dispositivo.
4. Fazer backup também no celular se ele já tiver marcações. Abrir o link privado. O primeiro acesso reúne as leituras já marcadas de ambos, sem atribuir estudo ou domínio.
5. Testar marcar e desmarcar uma subseção de RLM e verificar, após alguns segundos ou clicando **Sincronizar agora**, que o estado aparece no outro aparelho.

## Arquitetura e segurança

- **Não existe sistema de contas no site.** A autenticação é um código aleatório de 256 bits, conhecido apenas pelo dono. A validação de seu hash SHA-256 ocorre exclusivamente na Edge Function privada `concurso-pareamento` do Supabase, nunca no JavaScript público.
- O cliente `assets/sync.js` envia o código em cabeçalho HTTPS `x-concurso-key`, e a Edge Function só prossegue após comparar seu hash.
- A Edge Function tem `verify_jwt=false` porque utiliza **autenticação própria obrigatória** no código. Quem não apresenta o código correto recebe 401.
- A tabela `public.concurso_pair_items` tem RLS habilitado, **nenhuma política de leitura/escrita para anon/autenticado** e permissões revogadas para esses papéis; o serviço acessa-a apenas após validar o código.
- A chave administrativa do Supabase nunca é enviada ao navegador nem publicada no repositório. A Edge Function lê a credencial do próprio ambiente seguro Supabase.
- O site em GitHub Pages contém somente URL pública e chave **publishable** em `assets/sync-config.js`; estas não dão acesso direto ao progresso.
- O código de pareamento não está no repositório, nem é enviado ao Supabase Auth. O código fica salvo em `localStorage` de cada navegador após pareamento, portanto **não se deve vincular dispositivos públicos** nem compartilhar o link com terceiros.
- O código funciona como uma chave de acesso: quem o possuir pode ler e alterar o progresso. Para revogar o acesso, é preciso trocar o código e redeployar o hash no backend, além de atualizar aparelhos.
- Os dados não são publicados no GitHub nem sincronizados automaticamente com os documentos privados da Biblioteca.
- O esquema anterior `concurso_sync_items` e autenticação por e-mail não são utilizados pelo novo fluxo. A versão antiga da tabela permanece vazia e com RLS.

## Dados e comportamento

- RLM: leitura por subseção (71 IDs); Engenharia: 37 IDs; Português: 21 IDs.
- Planejamento: conclusões de atividades, disponibilidade, histórico de questões e conclusões de revisões. Preferência de Português `autoMark` também sincronizada.
- Na primeira vinculação, marcadores positivos de leitura de ambos os dispositivos são reunidos. Depois, marcações podem ser revertidas.
- O cliente sincroniza periodicamente com internet e ao voltar para a página. Mudanças quase simultâneas do **mesmo** item podem gerar conflitos; faça backups periódicos.
- Cada dispositivo continua mantendo seu armazenamento local. Um status de backup ou publicação não comprova estudo nem domínio.

## Testes e verificação

- GitHub Actions: teste de dois navegadores com API mockada, cobrindo primeira migração, módulo 4, reversão, Engenharia, Português e registros de questões; testes mobile nas larguras 320, 390 e 430 px.
- Supabase: migração privada executada, RLS habilitado e Edge Function `concurso-pareamento` implantada.
- A confirmação ponta a ponta com o progresso **real** depende do primeiro pareamento dos dispositivos. Não inventar marcações importadas ou sincronização real concluída antes disso.
