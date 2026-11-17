import { CHAIR_TYPES, CHAIRS_SLUG, chairTypesOf, isChair } from "./chair-types";
import { norm } from "./product-order";
import type { Product } from "./types";

/**
 * Navegación visual por tipo dentro de una categoría (tarjetas con foto debajo del título).
 * Hoy: Sillas (madera, tapizadas, metálicas…) y Vajilla (blanca, de gres, decorada).
 * Un producto puede estar en varios tipos. Los tipos salen del texto del producto y, además,
 * se pueden asignar a mano desde el panel (columna chair_tags de products).
 */
export type SubType = { key: string; label: string; rep?: string };
export type SubNav = {
  slug: string;
  allLabel: string;
  line: string;
  types: readonly SubType[];
  /** ¿El producto forma parte de esta sección? (Sillas suma las sillas de exterior). */
  member: (p: Product, catSlug: string | undefined) => boolean;
  typesOf: (p: Product, catSlug: string | undefined) => Set<string>;
  /** Mostrar también las tarjetas de tipos que todavía no tienen productos. */
  showEmpty?: boolean;
  /** Agrupar el listado en bloques con título, uno por tipo y en este orden (cada producto va en un solo bloque). */
  blocks?: boolean;
};

const VAJILLA_TYPES = [
  { key: "platos", label: "Platos", rep: "EST-07" },
  { key: "platos-pequenos", label: "Platos pequeños", rep: "CER-03" },
  { key: "bowls", label: "Bowls y cuencos", rep: "CER-04" },
  { key: "platos-tazas", label: "Platos para tazas" },
  { key: "fuentes", label: "Fuentes y bandejas" },
  { key: "juegos", label: "Juegos y sets de vajilla", rep: "EST-01" },
] as const;
const VAJILLA_KEYS: string[] = VAJILLA_TYPES.map((t) => t.key);

/** Tipo de pieza de vajilla según su nombre (uno solo); se puede corregir a mano desde el panel. */
function vajillaType(p: Product): string {
  const n = norm(p.name);
  if (/^(set|juego|vajilla|coleccion)\b|· set x\d|\bset x\d/.test(n)) return "juegos";
  if (/^(fuente|bandeja|azafate|plato de servir|plato de presentacion)\b/.test(n)) return "fuentes";
  if (/^(platito|plato para taza|plato de taza|plato de cafe|plato de te)\b/.test(n)) return "platos-tazas";
  if (/^(bowl|bol|cuenco|compotera|ensaladera|tazon)\b/.test(n)) return "bowls";
  if (/^plato\b/.test(n)) {
    const cm = Number(n.match(/(\d+(?:[.,]\d+)?) ?cm/)?.[1]?.replace(",", ".") ?? 0);
    return /postre|pan\b|pequen|entrada|aperitivo/.test(n) || (cm > 0 && cm <= 20) ? "platos-pequenos" : "platos";
  }
  return "juegos";
}

export const SUBNAVS: Record<string, SubNav> = {
  [CHAIRS_SLUG]: {
    slug: CHAIRS_SLUG,
    allLabel: "Todas las sillas",
    line: "Soluciones de mobiliario para restaurantes, hoteles y espacios gastronómicos.",
    types: CHAIR_TYPES,
    member: (p, s) => isChair(p, s),
    typesOf: (p, s) => chairTypesOf(p, s) as Set<string>,
  },
  vajilla: {
    slug: "vajilla",
    allLabel: "Toda la vajilla",
    line: "Platos, bowls, cuencos y piezas de servicio para cada estilo de mesa.",
    types: VAJILLA_TYPES,
    showEmpty: true,
    blocks: true,
    member: (_p, s) => s === "vajilla",
    typesOf: (p) => {
      const manual = (p.chair_tags ?? []).filter((t) => VAJILLA_KEYS.includes(t));
      return new Set(manual.length ? manual : [vajillaType(p)]);
    },
  },
};

/** Navegación que corresponde a un producto en el panel (para mostrar sus casillas de tipo). */
export function subnavOfProduct(p: Product, catSlug: string | undefined): SubNav | null {
  return Object.values(SUBNAVS).find((n) => n.member(p, catSlug)) ?? null;
}
export const ALL_SUB_KEYS = Object.values(SUBNAVS).flatMap((n) => n.types.map((t) => t.key));
