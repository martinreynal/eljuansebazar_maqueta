-- Historial de cambios (panel · Textos): registro de lo que se modifica en la web
create table if not exists public.change_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  author      text not null default '',
  source      text not null default 'manual' check (source in ('panel', 'claude', 'manual')),
  area        text not null default 'General',
  title       text not null check (char_length(title) between 1 and 300),
  detail      text not null default '',
  ref         text not null default ''
);
create index if not exists change_log_created_idx on public.change_log (created_at desc);
alter table public.change_log enable row level security;
create policy "historial: admin lee"     on public.change_log for select using (public.is_admin());
create policy "historial: admin agrega"  on public.change_log for insert with check (public.is_admin());
create policy "historial: admin edita"   on public.change_log for update using (public.is_admin()) with check (public.is_admin());
create policy "historial: admin borra"   on public.change_log for delete using (public.is_admin());
