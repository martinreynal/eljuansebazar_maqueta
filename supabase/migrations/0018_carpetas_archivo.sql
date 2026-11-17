-- Carpetas del archivo: "archivados" (pendientes de completar datos) y "rearchivados" (archivo histórico).
create table if not exists public.backup_products_archivo_20261117 as
  select id, sku, archived, visible, staged from public.products;
alter table public.backup_products_archivo_20261117 enable row level security;

alter table public.products add column if not exists archive_bin text
  check (archive_bin in ('archivados', 'rearchivados'));

-- Los 442 que ya estaban archivados pasan a Rearchivados.
update public.products set archive_bin = 'rearchivados' where archived;
-- Todo el catálogo activo, salvo EST-09, pasa a Archivados (conserva "visible" para desarchivar sin perderlo).
update public.products set archived = true, archive_bin = 'archivados'
  where not archived and sku <> 'EST-09';
