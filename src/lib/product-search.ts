import { searchable } from "./format";
import type { Category, Product } from "./types";

/**
 * Búsqueda de productos del catálogo.
 * - Singular y plural dan lo mismo («vasos» = «vaso», «cuchillos» = «cuchillo», «coladores» = «colador»).
 * - Cada palabra busca el comienzo de una palabra del producto («cuch» encuentra «cuchillo»), no cualquier pedazo
 *   («te» no trae «terminación»; las palabras de 1 o 2 letras tienen que coincidir enteras).
 * - El código funciona con o sin guion («CER-02», «cer02», «cer 02»).
 * - Solo mira lo que describe al producto: nombre, código, categoría, materiales, variantes y el comienzo de la descripción
 *   (no el texto genérico del final, como «Consultá por variantes de color, terminación y medida»).
 */

const stem = (w: string) => (w.length > 4 && /[^aeiou]es$/.test(w) ? w.slice(0, -2) : w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w);
export const tokens = (s: string) => searchable(s).split(" ").filter(Boolean).map(stem);
const skuKey = (s: string) => searchable(s).replace(/ /g, "");

/** Código buscado, si el texto parece un código de producto (ej.: «cer02», «CER-02», «sil 226»). */
export const skuQuery = (q: string) => (/^\s*[a-z]{2,4}\d?\s*-?\s*\d{1,4}\s*$/i.test(q) ? skuKey(q) : "");

const hit = (qt: string, hay: string[]) => hay.some((t) => (qt.length <= 2 ? t === qt : t.startsWith(qt)));

export type SearchIndex = Map<string, { all: string[]; name: string[]; cat: string[]; sku: string }>;

export function buildIndex(products: Product[], categories: Category[]): SearchIndex {
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  return new Map(
    products.map((p) => {
      const cat = catName.get(p.category_id ?? "") ?? "";
      const desc = p.description.split(".").slice(0, 2).join(" ");
      const name = tokens(p.name);
      return [p.id, { name, cat: tokens(cat), sku: skuKey(p.sku), all: [...name, ...tokens(`${p.sku} ${cat} ${p.materials} ${p.variants.join(" ")} ${desc}`)] }];
    }),
  );
}

/** ¿El producto coincide con la búsqueda? */
export function matches(idx: SearchIndex, p: Product, q: string): boolean {
  const e = idx.get(p.id);
  if (!e) return false;
  const sk = skuQuery(q);
  if (sk && e.sku === sk) return true;
  const qt = tokens(q);
  return qt.length > 0 && qt.every((t) => hit(t, e.all));
}

/** Relevancia (mayor = más arriba): código exacto, después lo que lo dice en el nombre, después la categoría y por último la descripción. */
export function relevance(idx: SearchIndex, p: Product, q: string): number {
  const e = idx.get(p.id);
  if (!e) return 0;
  const sk = skuQuery(q);
  if (sk && e.sku === sk) return 1000;
  const qt = tokens(q);
  let s = 0;
  if (qt.every((t) => hit(t, e.name))) s += 100;
  else s += 10 * qt.filter((t) => hit(t, e.name)).length;
  if (qt[0] && e.name[0]?.startsWith(qt[0])) s += 50;
  if (qt.every((t) => hit(t, e.cat))) s += 20;
  return s;
}
