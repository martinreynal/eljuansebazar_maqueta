-- Contracara: campos de la planilla de clasificación INGES (aplicada desde Claude el 2026-11-18).
alter table public.product_sourcing
  add column if not exists inges_order text not null default '',
  add column if not exists customs_name text not null default '',
  add column if not exists customs_description text not null default '',
  add column if not exists origin text not null default '',
  add column if not exists operating_details text not null default '',
  add column if not exists material_composition text not null default '',
  add column if not exists sample text not null default '',
  add column if not exists customs_notes text not null default '',
  add column if not exists total_pcs integer,
  add column if not exists total_cartons integer,
  add column if not exists total_cbm numeric,
  add column if not exists fob_djai numeric,
  add column if not exists net_weight_g numeric,
  add column if not exists shipping_mode text not null default '' check (shipping_mode in ('', 'maritimo', 'aereo')),
  add column if not exists loading_port text not null default '',
  add column if not exists hs_code text not null default '';
