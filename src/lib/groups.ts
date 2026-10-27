import type { Category, CategoryGroup } from "./types";

/** Grandes grupos del catálogo. Cada categoría es una subcategoría de uno de ellos. */
export const GROUPS: { key: CategoryGroup; name: string; line: string }[] = [
  { key: "bazar", name: "Bazar", line: "Vajilla, cristalería, cubiertos y utensilios" },
  { key: "mobiliario", name: "Mobiliario", line: "Sillas, mesas, banquetas, sillones y exterior" },
];
const MOBILIARIO = new Set(["sillas", "sofas-y-sillones", "banquetas", "boxes-y-bancos", "mesas", "mesas-auxiliares", "sets", "exterior", "exterior-lounge"]);

/** Grupo de una categoría (si falta el dato, se deduce: lo que no es mobiliario es bazar). */
export function groupOf(c: Pick<Category, "slug" | "is_offers"> & { grupo?: CategoryGroup | null }): CategoryGroup | null {
  if (c.is_offers) return null;
  return c.grupo ?? (MOBILIARIO.has(c.slug) ? "mobiliario" : "bazar");
}
export const groupByKey = (k: string) => GROUPS.find((g) => g.key === k);
export const groupHref = (k: CategoryGroup) => `/categoria/${k}`;
