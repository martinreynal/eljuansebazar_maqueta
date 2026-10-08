// Datos públicos del proyecto de Supabase (pensados para ir en la web; no son secretos).
// Se pueden reemplazar con variables de entorno sin tocar el código.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ujhzhyraalxcblchnztu.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_my4388lrihmY770RDDQ4-g_VbWJz4qA";

/** true cuando las variables de Supabase están cargadas. Sin ellas, la tienda muestra los datos de demostración. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function siteUrl(fromSettings?: string): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    fromSettings ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/** URL pública de un archivo del bucket "media". */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:)/.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
