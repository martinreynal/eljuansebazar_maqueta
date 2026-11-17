import { CHAIR_TYPES, CHAIRS_SLUG, chairTypesOf, isChair } from "./chair-types";
import type { Product } from "./types";

/**
 * Navegación visual por tipo dentro de una categoría (tarjetas con foto debajo del título).
 * Hoy: Sillas (madera, tapizadas, metálicas…). Vajilla dejó de tener tipos: Platos, Bowls y Fuentes y bandejas son categorías propias.
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

export const SUBNAVS: Record<string, SubNav> = {
  [CHAIRS_SLUG]: {
    slug: CHAIRS_SLUG,
    allLabel: "Todas las sillas",
    line: "Soluciones de mobiliario para restaurantes, hoteles y espacios gastronómicos.",
    types: CHAIR_TYPES,
    member: (p, s) => isChair(p, s),
    typesOf: (p, s) => chairTypesOf(p, s) as Set<string>,
  },
};

/** Navegación que corresponde a un producto en el panel (para mostrar sus casillas de tipo). */
export function subnavOfProduct(p: Product, catSlug: string | undefined): SubNav | null {
  return Object.values(SUBNAVS).find((n) => n.member(p, catSlug)) ?? null;
}
export const ALL_SUB_KEYS = Object.values(SUBNAVS).flatMap((n) => n.types.map((t) => t.key));
