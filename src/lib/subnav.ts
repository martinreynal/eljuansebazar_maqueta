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
};

const VAJILLA_TYPES = [
  { key: "blanca", label: "Vajilla blanca", rep: "EST-01" },
  { key: "gres", label: "Vajilla de gres", rep: "GRL-02" },
  { key: "decorada", label: "Vajilla decorada", rep: "FLO-02" },
] as const;

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
    line: "Platos, bowls y piezas de servicio para cada estilo de mesa.",
    types: VAJILLA_TYPES,
    member: (_p, s) => s === "vajilla",
    typesOf: (p) => {
      const t = norm(`${p.name}. ${p.description.split(".").slice(0, 2).join(" ")} ${p.materials}`);
      const tags = p.chair_tags ?? [];
      const s = new Set<string>();
      if (tags.includes("gres") || /\bgres\b/.test(t)) s.add("gres");
      if (tags.includes("decorada") || /decorad|marmolad/.test(t)) s.add("decorada");
      if (tags.includes("blanca") || (/\bblanc/.test(t) && !s.has("gres") && !s.has("decorada"))) s.add("blanca");
      return s;
    },
  },
};

/** Navegación que corresponde a un producto en el panel (para mostrar sus casillas de tipo). */
export function subnavOfProduct(p: Product, catSlug: string | undefined): SubNav | null {
  return Object.values(SUBNAVS).find((n) => n.member(p, catSlug)) ?? null;
}
export const ALL_SUB_KEYS = Object.values(SUBNAVS).flatMap((n) => n.types.map((t) => t.key));
