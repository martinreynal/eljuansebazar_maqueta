-- Modelo 3D opcional por producto (ruta a un archivo .glb/.gltf en /public/modelos o en el bucket media)
alter table public.products add column if not exists model_url text;
update public.products set model_url = '/modelos/CUB-27.glb' where sku = 'CUB-27';
