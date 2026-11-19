-- Concurso Estudos — sincronização pessoal SEM CADASTRO.
-- Projeto Supabase privado; o backend Edge Function verifica código de pareamento
-- ANTES de acessar qualquer progresso. Nunca compartilhar código privado no GitHub.
--
-- Dados individuais nunca devem ser públicos nem acessíveis via cliente com
-- a chave publishable. Usuário único: não há cadastro de e-mail no site.
create table if not exists public.concurso_pair_items (
  item_key text primary key check (char_length(item_key) between 3 and 180),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload ? 'value'),
  updated_at timestamptz not null default now()
);

alter table public.concurso_pair_items enable row level security;
revoke all on public.concurso_pair_items from anon, authenticated, public;

-- Intencionalmente SEM políticas para anon/authenticated.
-- Apenas a Edge Function "concurso-pareamento" acessa esta tabela com
-- credenciais privilegiadas do AMBIENTE SUPABASE (jamais do navegador).
-- A Edge Function tem verify_jwt=false porque valida obrigatoriamente
-- um segredo pessoal de alta entropia (SHA-256) por sua própria lógica.
--
-- A tabela anterior "concurso_sync_items" (por auth.uid) é legado não
-- utilizado e não deve receber dados pessoais na arquitetura atual.
