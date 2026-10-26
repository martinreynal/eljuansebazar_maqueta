-- Dos grandes grupos de categorías: Bazar y Mobiliario (las categorías pasan a ser subcategorías)
alter table public.categories add column if not exists grupo text check (grupo in ('bazar','mobiliario'));
update public.categories set grupo='mobiliario' where slug in ('sillas','sofas-y-sillones','banquetas','boxes-y-bancos','mesas','mesas-auxiliares','exterior','exterior-lounge');
update public.categories set grupo='bazar' where slug in ('vajilla-blanca','gres','vajilla-decorada','vajilla-marmolada','platos-y-bowls','vajilla-oriental','cubiertos','asado-y-parrilla','cristaleria','cafe');
