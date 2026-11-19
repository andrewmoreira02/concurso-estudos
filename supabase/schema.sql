-- Concurso Estudos: progresso PRIVADO por usuário.
-- Executar no SQL Editor de um projeto Supabase privado.
-- Nunca executar desabilitando RLS nem publicar dados de usuário no repositório.
create table if not exists public.concurso_sync_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 3 and 180),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload ? 'value'),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.concurso_sync_items enable row level security;
revoke all on public.concurso_sync_items from anon;
grant select, insert, update, delete on public.concurso_sync_items to authenticated;

drop policy if exists "sync_select_own" on public.concurso_sync_items;
create policy "sync_select_own" on public.concurso_sync_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "sync_insert_own" on public.concurso_sync_items;
create policy "sync_insert_own" on public.concurso_sync_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "sync_update_own" on public.concurso_sync_items;
create policy "sync_update_own" on public.concurso_sync_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "sync_delete_own" on public.concurso_sync_items;
create policy "sync_delete_own" on public.concurso_sync_items
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- RLS aplica-se também às requisições feitas com a chave pública do frontend.
-- Nunca usar secret/service_role no navegador.
