import { BAZAR_ICONS } from "./BazarIcons";
import { MOBILIARIO_ICONS } from "./MobiliarioIcons";

/**
 * Íconos ilustrados de las categorías (planos, geométricos, en la paleta de la marca).
 * Cada uno se dibuja en una caja de 64 × 64. Si una categoría no tiene ícono propio, se usa uno genérico de su grupo.
 */
const F = "#1E4D3D", T = "#C96F4A", B = "#A9532F", M = "#E0AE55", C = "#F1DDBF", S = "#5E7F67", W = "#FBF4EA", K = "#4A3326";

const ICONS: Record<string, React.ReactNode> = {
  /* ---------- Bazar ---------- */
  vajilla: <>
    <path d="M9 41h46c0 7-10 12-23 12S9 48 9 41Z" fill={C} />
    <path d="M9 28h46c0 8-10 14-23 14S9 36 9 28Z" fill={F} />
    <path d="M9 14h46c0 8-10 14-23 14S9 22 9 14Z" fill={M} />
    <ellipse cx="32" cy="14" rx="23" ry="3" fill="#F3C877" />
  </>,
  platos: <>
    <circle cx="32" cy="32" r="25" fill={T} />
    <circle cx="32" cy="32" r="19" fill={C} />
    <circle cx="32" cy="32" r="14" fill={W} />
  </>,
  bowls: <>
    <path d="M10 28h44c0 13-10 22-22 22S10 41 10 28Z" fill={T} />
    <path d="M12 20h40v8H12Z" fill={F} />
    <path d="M12 20h40c0 4-9 8-20 8s-20-4-20-8Z" fill="#163B2F" />
  </>,
  "fuentes-y-bandejas": <>
    <rect x="7" y="16" width="50" height="34" rx="7" fill={F} />
    <rect x="7" y="14" width="50" height="32" rx="7" fill={T} />
    <rect x="13" y="20" width="38" height="20" rx="4" fill={M} />
  </>,
  cubiertos: <>
    <path d="M20 8v14c0 3 2 5 4 6v26a2.5 2.5 0 0 1-5 0V28c-2-1-4-3-4-6V8h2v12h1.5V8h2v12H22V8Z" fill={M} />
    <path d="M42 8c6 4 8 14 6 22h-3v24a3 3 0 0 1-6 0V10c0-1.5 1.5-2.6 3-2Z" fill={T} />
  </>,
  cafe: <>
    <ellipse cx="32" cy="50" rx="24" ry="5" fill={F} />
    <path d="M14 22h32v14c0 8-7 13-16 13S14 44 14 36Z" fill={M} />
    <path d="M46 26h3a7 7 0 0 1 0 14h-4.5" fill="none" stroke={M} strokeWidth="4" />
  </>,
  cristaleria: <>
    <path d="M14 8h20c1 11-3 20-10 21-7-1-11-10-10-21Z" fill={B} />
    <rect x="22.5" y="28" width="3" height="18" fill={B} />
    <rect x="16" y="45" width="16" height="4" rx="2" fill={B} />
    <path d="M34 28h22L45 40Z" fill={M} />
    <rect x="43.5" y="39" width="3" height="11" fill={M} />
    <rect x="38" y="49" width="14" height="3.5" rx="1.75" fill={M} />
  </>,
  servicio: <>
    <rect x="12" y="26" width="40" height="24" rx="5" fill={S} />
    <rect x="6" y="29" width="8" height="5" rx="2.5" fill={S} />
    <rect x="50" y="29" width="8" height="5" rx="2.5" fill={S} />
    <path d="M10 26c2-7 11-11 22-11s20 4 22 11Z" fill={M} />
    <rect x="29" y="10" width="6" height="6" rx="2" fill={B} />
  </>,
  "decoracion-y-presentacion": <>
    <circle cx="31" cy="40" r="18" fill={T} />
    <path d="M32 22c-1-8 4-14 13-15-1 8-6 13-13 15Z" fill={F} />
    <path d="M31 22c-2-6-8-9-14-8 2 6 8 9 14 8Z" fill={S} />
  </>,

  /* ---------- Mobiliario ---------- */
  "camas-y-cabeceras": <>
    <rect x="6" y="18" width="10" height="28" rx="3" fill={B} />
    <rect x="6" y="30" width="52" height="12" rx="3" fill={T} />
    <rect x="16" y="26" width="42" height="6" rx="3" fill={M} />
    <rect x="18" y="21" width="14" height="7" rx="3.5" fill={C} />
    <rect x="8" y="42" width="4" height="7" fill={K} /><rect x="52" y="42" width="4" height="7" fill={K} />
  </>,
  "mesas-de-luz-y-auxiliares": <>
    <rect x="12" y="16" width="40" height="30" rx="3" fill={K} />
    <rect x="15" y="20" width="34" height="10" rx="2" fill={M} />
    <rect x="15" y="33" width="34" height="10" rx="2" fill={T} />
    <rect x="29" y="24" width="6" height="2.5" rx="1.25" fill={K} /><rect x="29" y="37" width="6" height="2.5" rx="1.25" fill={K} />
    <rect x="15" y="46" width="4" height="7" fill={K} /><rect x="45" y="46" width="4" height="7" fill={K} />
  </>,
  "armarios-y-almacenamiento": <>
    <rect x="14" y="8" width="36" height="44" rx="3" fill={T} />
    <rect x="17" y="11" width="14" height="38" rx="2" fill={M} />
    <rect x="33" y="11" width="14" height="38" rx="2" fill={M} />
    <rect x="27" y="27" width="2" height="7" rx="1" fill={B} /><rect x="35" y="27" width="2" height="7" rx="1" fill={B} />
    <rect x="16" y="52" width="4" height="5" fill={K} /><rect x="44" y="52" width="4" height="5" fill={K} />
  </>,
  escritorios: <>
    <rect x="6" y="28" width="52" height="6" rx="2" fill={M} />
    <rect x="10" y="34" width="4" height="20" fill={B} /><rect x="50" y="34" width="4" height="20" fill={B} />
    <path d="M40 28V18l8-7" fill="none" stroke={T} strokeWidth="3" strokeLinecap="round" />
    <path d="M44 6l10 6-6 6Z" fill={T} />
  </>,
  sillas: <>
    <path d="M16 14c0-4 3-6 7-6h18c4 0 7 2 7 6v20H16Z" fill={T} />
    <rect x="10" y="26" width="8" height="18" rx="4" fill={B} /><rect x="46" y="26" width="8" height="18" rx="4" fill={B} />
    <rect x="16" y="32" width="32" height="12" rx="4" fill={T} />
    <rect x="18" y="44" width="4" height="12" fill={K} /><rect x="42" y="44" width="4" height="12" fill={K} />
  </>,
  "sofas-y-lounge": <>
    <rect x="8" y="16" width="48" height="14" rx="5" fill={M} />
    <rect x="4" y="24" width="10" height="20" rx="4" fill={S} /><rect x="50" y="24" width="10" height="20" rx="4" fill={S} />
    <rect x="8" y="32" width="48" height="12" rx="3" fill={F} />
    <rect x="12" y="28" width="19" height="7" rx="3" fill={C} /><rect x="33" y="28" width="19" height="7" rx="3" fill={C} />
    <rect x="10" y="44" width="4" height="6" fill={K} /><rect x="50" y="44" width="4" height="6" fill={K} />
  </>,
  mesas: <>
    <rect x="6" y="20" width="52" height="7" rx="2" fill={T} />
    <path d="M12 27l-2 26h4l4-26Z" fill={B} /><path d="M52 27l2 26h-4l-4-26Z" fill={B} />
    <rect x="16" y="33" width="32" height="3" fill={B} />
  </>,
  banquetas: <>
    <rect x="18" y="8" width="28" height="9" rx="3" fill={T} />
    <rect x="20" y="17" width="4" height="38" fill={B} /><rect x="40" y="17" width="4" height="38" fill={B} />
    <rect x="20" y="40" width="24" height="3" fill={B} />
  </>,
  "mostradores-y-recepcion": <>
    <rect x="8" y="30" width="48" height="22" rx="2" fill={M} />
    <rect x="6" y="26" width="52" height="6" rx="2" fill={T} />
    <rect x="12" y="36" width="40" height="3" rx="1.5" fill="#C99640" />
    <path d="M24 26a8 8 0 0 1 16 0Z" fill={B} /><rect x="30.5" y="13" width="3" height="5" rx="1.5" fill={B} />
  </>,
  "mobiliario-para-eventos": <>
    <rect x="18" y="8" width="4" height="48" fill={T} /><rect x="42" y="8" width="4" height="48" fill={T} />
    <rect x="18" y="10" width="28" height="3" fill={T} /><rect x="18" y="16" width="28" height="3" fill={T} /><rect x="18" y="22" width="28" height="3" fill={T} />
    <rect x="16" y="32" width="32" height="6" rx="2" fill={M} />
    <rect x="18" y="44" width="28" height="2.5" fill={B} />
  </>,
  exterior: <>
    <path d="M6 24C10 12 20 6 32 6s22 6 26 18Z" fill={T} />
    <path d="M24 24c0-10 3-16 8-18 5 2 8 8 8 18Z" fill={M} />
    <rect x="30.5" y="22" width="3" height="32" fill={K} />
    <rect x="14" y="40" width="36" height="4" rx="2" fill={M} />
    <rect x="17" y="44" width="3" height="10" fill={B} /><rect x="44" y="44" width="3" height="10" fill={B} />
  </>,
  "mobiliario-de-servicio": <>
    <rect x="10" y="14" width="40" height="4" rx="2" fill={B} />
    <rect x="10" y="18" width="4" height="26" fill={B} /><rect x="46" y="18" width="4" height="26" fill={B} />
    <rect x="12" y="22" width="36" height="16" rx="2" fill={M} />
    <rect x="10" y="38" width="40" height="4" rx="2" fill={B} />
    <path d="M50 16h4v-6" fill="none" stroke={B} strokeWidth="3" strokeLinecap="round" />
    <circle cx="16" cy="50" r="5" fill={F} /><circle cx="44" cy="50" r="5" fill={F} />
  </>,
};
const FALLBACK: Record<string, React.ReactNode> = {
  bazar: ICONS.platos,
  mobiliario: ICONS.sillas,
};

export function CategoryIcon({ slug, group }: { slug: string; group?: string | null }) {
  // Bazar: íconos ilustrados de la marca (caja de 100 × 100)
  const art = BAZAR_ICONS[slug] ?? MOBILIARIO_ICONS[slug];
  if (art) return <svg className="cat-ic" viewBox="0 0 100 100" aria-hidden focusable="false">{art}</svg>;
  const icon = ICONS[slug] ?? FALLBACK[group ?? ""] ?? ICONS.platos;
  return <svg className="cat-ic" viewBox="0 0 64 64" aria-hidden focusable="false">{icon}</svg>;
}
