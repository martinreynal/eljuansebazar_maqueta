-- Portada: fotos con mejor definición (resolución nativa y nitidez medidas sobre public/catalogo)
update public.settings set design = jsonb_set(design, '{heroProducts}', '["CUB-21","ORI-46","HOJ-01"]'::jsonb);
update public.products set featured = (sku in ('GR5-16','CUB-19','ORI-49','RAY-14'));
update public.categories c set image_path = '/catalogo/' || v.k || '.jpg' from (values
  ('vajilla-estandar','EST-07'),('gres','GR5-16'),('vajilla-blanca','BLC-01'),('vajilla-decorada','HOJ-01'),
  ('vajilla-marmolada','MAR-19'),('cubiertos','CUB-19'),('cristaleria','CRI-17'),('cafe','CER-07'),
  ('vajilla-oriental','ORI-40'),('sillas','SIL-028'),('mesas','MES-013'),('banquetas','BAN-016'),
  ('boxes-y-bancos','BOX-006'),('sofas-y-sillones','SOF-006'),('mesas-auxiliares','AUX-010'),('exterior','EXT-008')
) as v(s, k) where c.slug = v.s;
update public.custom_works set image_path = '/catalogo/CUB-32.jpg' where image_path = '/catalogo/CUB-40.jpg';
update public.custom_works set image_path = '/catalogo/VID-01.jpg' where image_path = '/catalogo/CRI-14.jpg';
