export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

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
