-- Cambio de marca: El Juanse Bazar → Saggio (equipamiento gastronómico)
update public.settings set
  business_name = 'Saggio',
  tagline = 'Equipamiento gastronómico',
  instagram = '', facebook = '', site_url = '',
  design = design || jsonb_build_object(
    'heroEyebrow', 'Equipamiento gastronómico',
    'heroTitle', 'Buenas decisiones para grandes experiencias',
    'heroText', 'Vajilla, cristalería, cubiertos y utensilios para restaurantes, cafeterías y hoteles, con la opción de personalizarlos con tu logo. Mirá el catálogo y pedinos una cotización por WhatsApp.',
    'promoTitle', 'Ofertas Saggio',
    'promoText', 'Precios especiales en vajilla y cristalería hasta agotar stock.'
  )
where id = 1;
