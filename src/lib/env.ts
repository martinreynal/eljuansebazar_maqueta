// Datos públicos del proyecto de Supabase (pensados para ir en la web; no son secretos).
// Se pueden reemplazar con variables de entorno sin tocar el código.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ujhzhyraalxcblchnztu.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_my4388lrihmY770RDDQ4-g_VbWJz4qA";

/** true cuando las variables de Supabase están cargadas. Sin ellas, la tienda muestra los datos de demostración. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function siteUrl(fromSettings?: string): string {
  // La dirección cargada en Configuración del panel manda; si está vacía, la del entorno de Vercel
  const raw =
    fromSettings ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/** Fotos del catálogo incluidas en la web (carpeta public/catalogo). */
export const isLocalImage = (path: string) => path.startsWith("/");

/** Versión chica (480 px) de una foto del catálogo, para tarjetas y PDF. */
export const miniImage = (path: string) => path.replace(/^\/catalogo\//, "/catalogo/mini/");

/** URL pública de una imagen: foto del catálogo (/catalogo/...) o archivo del bucket "media". */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:)/.test(path) || isLocalImage(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
