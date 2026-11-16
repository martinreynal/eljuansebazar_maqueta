import { norm } from "./product-order";
import type { Category, Product } from "./types";

/** Tipos de silla de la navegación visual de la sección Sillas. Un producto puede estar en varios. */
export const CHAIR_TYPES = [
  { key: "madera", label: "Madera", rep: "SIL-200" },
  { key: "tapizadas", label: "Tapizadas", rep: "SIL-193" },
  { key: "metalicas", label: "Metálicas y combinadas", rep: "SIL-242" },
  { key: "apoyabrazos", label: "Con apoyabrazos", rep: "SIL-202" },
  { key: "exterior", label: "Exterior", rep: "EXT-088" },
  { key: "apilables", label: "Apilables", rep: "SIL-254" },
] as const;
export type ChairType = (typeof CHAIR_TYPES)[number]["key"];
export const CHAIR_KEYS = CHAIR_TYPES.map((t) => t.key) as ChairType[];

/** Categoría principal de sillas: la navegación por tipos aparece cuando es la única elegida. */
export const CHAIRS_SLUG = "sillas";

/** ¿Es una silla? Las de la categoría Sillas y las sillas de las categorías de exterior. */
export function isChair(p: Product, catSlug: string | undefined): boolean {
  return catSlug === CHAIRS_SLUG || (!!catSlug?.startsWith("exterior") && /^silla\b/.test(norm(p.name)));
}

/** Tipos de una silla: lo que dice su descripción más los que se le asignaron a mano en el panel. */
export function chairTypesOf(p: Product, catSlug: string | undefined): Set<ChairType> {
  const t = norm(`${p.name}. ${p.description.split(".").slice(1, 3).join(" ")} ${p.materials}`);
  const s = new Set<ChairType>();
  if (/madera maciza|madera clara|patas de madera|sillas de madera/.test(t)) s.add("madera");
  if (/tapizad|capitone|terciopelo/.test(t)) s.add("tapizadas");
  if (/\bmetal|tolix|hierro|aluminio|acero/.test(t)) s.add("metalicas");
  if (/apoyabrazos|con brazos/.test(t)) s.add("apoyabrazos");
  if (catSlug?.startsWith("exterior") || /exterior/.test(t)) s.add("exterior");
  if (/apilable/.test(t)) s.add("apilables");
  for (const k of p.chair_tags ?? []) if ((CHAIR_KEYS as string[]).includes(k)) s.add(k as ChairType);
  return s;
}

export const slugOfCategory = (categories: Category[]) => {
  const m = new Map(categories.map((c) => [c.id, c.slug]));
  return (p: Product) => m.get(p.category_id ?? "");
};
