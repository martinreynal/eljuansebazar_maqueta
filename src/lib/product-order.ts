import type { Product } from "./types";

/** Orden predeterminado del catálogo, compartido por la web pública y el panel (Orden de visualización). */

export const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Materiales: los cargados en el producto más los que nombra la descripción. */
export const MAT_WORDS: [string, RegExp][] = [
  ["Gres", /\bgres\b/], ["Porcelana", /porcelana/], ["Cerámica", /ceramic/], ["Vidrio", /vidrio|cristal/], ["Acero inoxidable", /acero/],
  ["Madera", /madera|nogal|roble|teca|olivo/], ["Bambú", /bambu/], ["Tapizado", /tapizad|capitone|terciopelo|acanalad/], ["Cuero", /cuero/],
  ["Rattan y esterilla", /rat+an|tejid|cuerda|esterilla|mimbre/], ["Aluminio", /aluminio/], ["Mármol", /marmol/], ["Hierro", /hierro|fundicion/],
  ["Metal", /\bmetal|tolix/], ["Plástico", /polipropileno|plastic/],
];
export const matsOf = (p: Product) => { const t = norm(`${p.materials} ${p.name} ${p.description.split(".").slice(0, 2).join(" ")}`); return MAT_WORDS.filter(([, r]) => r.test(t)).map(([m]) => m); };

/** Material principal para ordenar: lo tapizado y lo tejido mandan sobre la estructura (ej.: «Tapizada · patas de metal» → Tapizado). */
const MAT_ORDER = ["Tapizado", "Cuero", "Rattan y esterilla", "Plástico", "Mármol", "Madera", "Hierro", "Aluminio", "Metal", "Acero inoxidable", "Gres", "Porcelana", "Cerámica", "Vidrio", "Bambú"];
export const matRank = (mats: string[]) => { const r = mats.map((m) => MAT_ORDER.indexOf(m)).filter((i) => i >= 0); return r.length ? Math.min(...r) : MAT_ORDER.length; };

/**
 * Orden por tipo dentro de una categoría:
 * - Cristalería: primero los vasos sueltos y después los sets y líneas.
 * - Mesas: primero las mesas armadas, después las tapas («Tapa Camerino») y al final las bases («Base Vinci»).
 */
export const kindRank = (p: Product) => {
  const n = norm(p.name);
  if (/^(set|linea)\b/.test(n) && /vaso|copa|vidrio|cristal/.test(n)) return 1;
  return /^tapa \S+$/.test(n) ? 1 : /^base \S+$/.test(n) ? 2 : 0;
};

/**
 * Orden predeterminado: primero el orden manual elegido en el panel (los productos ubicados a mano van adelante, según su número);
 * el resto, por tipo, por material y lo más nuevo primero.
 */
export function defaultCompare(a: Product, b: Product, mats: (p: Product) => string[] = matsOf): number {
  const sa = a.sort_order ?? null, sb = b.sort_order ?? null;
  if (sa !== null || sb !== null) {
    if (sa === null) return 1;
    if (sb === null) return -1;
    if (sa !== sb) return sa - sb;
  }
  return kindRank(a) - kindRank(b) || matRank(mats(a)) - matRank(mats(b)) || b.created_at.localeCompare(a.created_at);
}
