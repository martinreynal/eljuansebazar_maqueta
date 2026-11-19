import type { Category, CategoryGroup } from "./types";

/** Grandes grupos del catálogo. Cada categoría es una subcategoría de uno de ellos. */
export const GROUPS: { key: CategoryGroup; name: string; line: string }[] = [
  { key: "bazar", name: "Bazar", line: "Vajilla, platos, cristalería, cubiertos y servicio" },
  { key: "mobiliario", name: "Mobiliario", line: "Camas, sillas, sillones, sofás, mesas, banquetas y más" },
];
const MOBILIARIO = new Set(["camas-y-cabeceras", "mesas-de-luz-y-auxiliares", "armarios-y-almacenamiento", "escritorios", "sillas", "sofas-y-lounge", "mesas", "banquetas", "mostradores-y-recepcion", "mobiliario-para-eventos", "exterior", "mobiliario-de-servicio", "sofas-y-sillones", "boxes-y-bancos", "bases-y-tapas", "mesas-auxiliares", "sets", "exterior-lounge"]);

/** Grupo de una categoría (si falta el dato, se deduce: lo que no es mobiliario es bazar). */
export function groupOf(c: Pick<Category, "slug" | "is_offers"> & { grupo?: CategoryGroup | null }): CategoryGroup | null {
  if (c.is_offers) return null;
  return c.grupo ?? (MOBILIARIO.has(c.slug) ? "mobiliario" : "bazar");
}
export const groupByKey = (k: string) => GROUPS.find((g) => g.key === k);
export const groupHref = (k: CategoryGroup) => `/categoria/${k}`;
