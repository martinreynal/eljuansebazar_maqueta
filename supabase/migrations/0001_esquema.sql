-- =====================================================================
-- El Juanse Bazar · Esquema de base de datos
-- Ya aplicado en el proyecto de Supabase "el-juanse-bazar".
-- Se deja como referencia o para recrear la base en otro proyecto
-- (Supabase → SQL Editor, antes de 0002_datos_demo.sql).
-- =====================================================================

create extension if not exists pgcrypto;

-- Administradores: solo los usuarios cargados acá pueden editar ----------
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Configuración general (una sola fila) -------------------------------
create table public.settings (
  id            int primary key default 1 check (id = 1),
  business_name text    not null default 'El Juanse Bazar',
  tagline       text    not null default 'Bazar a medida',
  whatsapp      text    not null check (whatsapp ~ '^[0-9]{10,15}$'),
  hours         text    not null default '',
  instagram     text    not null default '',
  facebook      text    not null default '',
  site_url      text    not null default '',
  show_prices   boolean not null default false,
  design        jsonb   not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

-- Categorías -----------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name       text not null check (char_length(name) between 2 and 60),
  image_path text,
  position   int  not null default 0,
  active     boolean not null default true,
  is_offers  boolean not null default false, -- virtual: muestra productos con etiqueta "oferta"
  created_at timestamptz not null default now()
);

-- Productos ------------------------------------------------------------
create type public.availability as enum ('disponible', 'consultar', 'sin_stock', 'discontinuado');

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  sku           text not null unique check (sku ~ '^[A-Z0-9-]{2,20}$'),
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name          text not null check (char_length(name) between 3 and 120),
  category_id   uuid references public.categories(id) on delete set null,
  description   text not null default '',
  materials     text not null default '',
  dimensions    text not null default '',
  variants      text[] not null default '{}',
  price         numeric(12,2) check (price is null or price >= 0),
  old_price     numeric(12,2) check (old_price is null or old_price >= 0),
  price_visible boolean not null default true,
  availability  public.availability not null default 'disponible',
  stock         int check (stock is null or stock >= 0),
  tag           text not null default '' check (tag in ('', 'nuevo', 'oferta', 'destacado')),
  featured      boolean not null default false,
  visible       boolean not null default true,
  archived      boolean not null default false,
  images        text[] not null default '{}',   -- rutas dentro del bucket "media"
  placeholder   jsonb,                         -- dibujo ilustrativo mientras no haya fotos
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_created_idx  on public.products (created_at desc);

-- Preguntas frecuentes y trabajos personalizados -----------------------
create table public.faqs (
  id       uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 3 and 200),
  answer   text not null check (char_length(answer) between 3 and 2000),
  position int  not null default 0
);

create table public.custom_works (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 2 and 80),
  technique   text not null default '',
  quantity    text not null default '',
  image_path  text,
  placeholder jsonb,
  position    int  not null default 0
);

-- Estadísticas: eventos anónimos (sin datos personales) ------------------
create table public.events (
  id          bigint generated always as identity primary key,
  type        text not null check (type in ('product_view', 'wa_click', 'category_view', 'list_send')),
  channel     text check (channel is null or channel in ('product', 'list', 'general', 'custom', 'quote')),
  product_id  uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index events_created_idx on public.events (created_at desc);
create index events_product_idx on public.events (product_id);
create index events_category_idx on public.events (category_id);

-- updated_at automático -------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end; $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Seguridad (RLS): el público solo LEE lo publicado y registra eventos;
-- solo los administradores escriben. ------------------------------------
alter table public.admins       enable row level security;
alter table public.settings     enable row level security;
alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.faqs         enable row level security;
alter table public.custom_works enable row level security;
alter table public.events       enable row level security;

create policy "admins: cada uno ve su fila" on public.admins
  for select using (user_id = (select auth.uid()));

create policy "settings: lectura pública" on public.settings for select using (true);
create policy "settings: admin edita"     on public.settings for update using (public.is_admin()) with check (public.is_admin());

create policy "categorias: lectura pública de activas" on public.categories
  for select using (active or public.is_admin());
create policy "categorias: admin inserta" on public.categories for insert with check (public.is_admin());
create policy "categorias: admin edita"   on public.categories for update using (public.is_admin()) with check (public.is_admin());
create policy "categorias: admin borra"   on public.categories for delete using (public.is_admin());

create policy "productos: lectura pública de publicados" on public.products
  for select using ((visible and not archived and availability <> 'discontinuado') or public.is_admin());
create policy "productos: admin inserta" on public.products for insert with check (public.is_admin());
create policy "productos: admin edita"   on public.products for update using (public.is_admin()) with check (public.is_admin());
create policy "productos: admin borra"   on public.products for delete using (public.is_admin());

create policy "faqs: lectura pública" on public.faqs for select using (true);
create policy "faqs: admin inserta"   on public.faqs for insert with check (public.is_admin());
create policy "faqs: admin edita"     on public.faqs for update using (public.is_admin()) with check (public.is_admin());
create policy "faqs: admin borra"     on public.faqs for delete using (public.is_admin());

create policy "trabajos: lectura pública" on public.custom_works for select using (true);
create policy "trabajos: admin inserta"   on public.custom_works for insert with check (public.is_admin());
create policy "trabajos: admin edita"     on public.custom_works for update using (public.is_admin()) with check (public.is_admin());
create policy "trabajos: admin borra"     on public.custom_works for delete using (public.is_admin());

create policy "eventos: cualquiera registra" on public.events
  for insert to anon, authenticated
  with check (type in ('product_view', 'wa_click', 'category_view', 'list_send'));
create policy "eventos: admin lee" on public.events for select using (public.is_admin());
create policy "eventos: admin borra" on public.events for delete using (public.is_admin());

-- Almacenamiento de imágenes (bucket público "media", máx. 10 MB) --------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "media: admin sube" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin modifica" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media: admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- Ranking público "más consultados": solo totales por producto ----------
create or replace function public.top_products(days int default 90, lim int default 6)
returns table (product_id uuid, total bigint)
language sql stable security definer set search_path = public as $$
  select e.product_id, count(*) as total
  from public.events e
  where e.type = 'wa_click' and e.product_id is not null
    and e.created_at > now() - make_interval(days => least(greatest(days, 1), 365))
  group by e.product_id
  order by total desc
  limit least(greatest(lim, 1), 24);
$$;
revoke execute on function public.top_products(int, int) from public;
grant execute on function public.top_products(int, int) to anon, authenticated;
