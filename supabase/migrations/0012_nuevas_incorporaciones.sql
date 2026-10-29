-- Nuevas incorporaciones: productos cargados ocultos (staged) hasta que se aprueban desde el panel
alter table public.products add column if not exists staged boolean not null default false;
