-- Orden de visualización (panel): posición manual de cada producto dentro de su categoría
-- y cantidad de productos por fila de cada categoría en el catálogo público.
alter table public.products add column if not exists sort_order integer;
alter table public.categories add column if not exists grid_cols smallint check (grid_cols between 3 and 6);
create index if not exists products_cat_sort_idx on public.products (category_id, sort_order);
