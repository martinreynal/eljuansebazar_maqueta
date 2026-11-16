-- Tipos de silla (navegación visual de la sección Sillas). Además de lo que se deduce de la descripción
-- (madera, tapizada, metal, exterior, apilable), cada producto puede sumar tipos a mano desde el panel.
alter table public.products add column if not exists chair_tags text[] not null default '{}';
