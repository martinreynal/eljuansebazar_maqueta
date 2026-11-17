-- Contracara de los productos (panel): datos internos de compra y logística de cada producto.
-- Solo la ven los administradores (no se publica nada de esto en la web).
create table if not exists public.product_sourcing (
  product_id       uuid primary key references public.products(id) on delete cascade,
  supplier         text not null default '',
  link             text not null default '',
  cost             numeric(14,2),
  currency         text not null default 'USD' check (currency in ('USD','ARS','CNY','EUR')),
  moq              integer check (moq is null or moq >= 0),
  lead_time        text not null default '',
  units_per_box    integer check (units_per_box is null or units_per_box >= 0),
  box_volume_m3    numeric(10,4),
  box_weight_kg    numeric(10,2),
  box_dimensions   text not null default '',
  material_measures text not null default '',
  certifications   text not null default '',
  restock          text not null default '',
  photos_authorized text not null default '' check (photos_authorized in ('', 'si', 'no', 'consultar')),
  photos_note      text not null default '',
  notes            text not null default '',
  updated_at       timestamptz not null default now(),
  updated_by       text not null default ''
);
alter table public.product_sourcing enable row level security;
create policy "contracara: admin lee"    on public.product_sourcing for select using (public.is_admin());
create policy "contracara: admin agrega" on public.product_sourcing for insert with check (public.is_admin());
create policy "contracara: admin edita"  on public.product_sourcing for update using (public.is_admin()) with check (public.is_admin());
create policy "contracara: admin borra"  on public.product_sourcing for delete using (public.is_admin());
