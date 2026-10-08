# El Juanse Bazar · Bazar a medida

Catálogo digital del bazar con cotizaciones por WhatsApp y panel administrador.
No hay carrito ni pagos: los visitantes arman una lista de consulta y la envían por WhatsApp.

- **Tienda:** inicio, catálogo con buscador por SKU o palabra clave, categorías, ofertas, ficha de producto, lista de consulta, favoritos, preguntas frecuentes, sección de personalización con logo y catálogo PDF (`/catalogo.pdf`, se genera solo).
- **Panel (`/admin`):** productos con fotos, disponibilidad y stock, categorías, textos de la portada, preguntas frecuentes, trabajos con logo, configuración (WhatsApp, horarios, mostrar u ocultar precios) y estadísticas.

## Tecnología

| Parte | Herramienta |
|---|---|
| Web | Next.js 15 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS 4 + hoja de estilos propia (`src/app/globals.css`) |
| Íconos | Lucide |
| Base de datos, login y fotos | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | Vercel |
| PDF | @react-pdf/renderer |

## Estructura

```
src/
  app/                  páginas (tienda) y rutas
    admin/              panel: login, módulos y acciones del servidor (actions.ts)
    api/events/         registro anónimo de estadísticas
    catalogo.pdf/       PDF del catálogo generado al vuelo
  components/           componentes de la tienda y del panel (components/admin)
  lib/                  datos, formato, WhatsApp, imágenes, clientes de Supabase
supabase/migrations/    esquema de la base y datos de demostración
public/                 logo, íconos, imagen para compartir
```

## Supabase

El proyecto **el-juanse-bazar** (región São Paulo) ya está creado, con las tablas, la seguridad (RLS) y los datos de demostración cargados. Los archivos de `supabase/migrations/` quedan como referencia.

Seguridad:
- El público solo puede **leer** lo publicado y registrar estadísticas anónimas.
- Solo los usuarios cargados en la tabla `admins` pueden crear, editar o borrar.
- Las fotos se guardan en el bucket público `media`; solo los administradores pueden subir o borrar.

### Crear el usuario administrador

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Email del administrador y la clave elegida. Marcá **Auto Confirm User**.
3. Darle permisos de administrador: en **SQL Editor** ejecutá (con el email real):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'email@ejemplo.com';
```

4. Recomendado: **Authentication → Sign In / Providers → Email** → desactivar **Allow new users to sign up**, para que nadie más pueda crear cuentas.

## Vercel

No hace falta configurar nada: `vercel.json` indica que es un proyecto Next.js y los datos públicos de Supabase ya están en `src/lib/env.ts`.
La dirección del sitio se toma sola del dominio de producción de Vercel.

Opcional (para cambiar de proyecto de Supabase o fijar el dominio sin tocar el código), en **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ujhzhyraalxcblchnztu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave **publishable** del proyecto (Supabase → Project Settings → API Keys) |
| `NEXT_PUBLIC_SITE_URL` | la dirección pública, por ejemplo `https://eljuansebazar.vercel.app` |

Si cargás variables, hacé **Deployments → Redeploy** para que se apliquen.

## Probar en la compu

```bash
npm install
cp .env.example .env.local   # completar con los datos de arriba
npm run dev                  # http://localhost:3000
```

## Uso diario

- Todo se edita desde `/admin`. Los cambios se ven en la tienda enseguida.
- Las fotos se achican y se convierten a JPEG automáticamente al subirlas.
- Mientras un producto no tenga fotos, la tienda muestra un dibujo ilustrativo.
- El aviso de la franja superior se cambia o se oculta en **Diseño y textos**.
- Las estadísticas registran visitas y clics en WhatsApp sin datos personales. Un clic es una consulta iniciada, no una venta.

## Costos a tener en cuenta

- **Vercel Hobby** (gratis) es solo para uso no comercial. Para la web del bazar en funcionamiento corresponde el plan Pro.
- **Supabase Free** pausa los proyectos después de una semana sin actividad. Si la web tiene poco tráfico, conviene el plan Pro.
