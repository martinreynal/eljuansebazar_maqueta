import type { Availability, Category, Product, Settings, Tag } from "./types";

export const AVAILABILITY: Record<Availability, string> = {
  disponible: "Disponible",
  consultar: "A consultar",
  sin_stock: "Sin stock",
  discontinuado: "Discontinuado",
};

export const TAGS: Record<Tag, string> = { "": "Sin etiqueta", nuevo: "Nuevo", oferta: "Oferta", destacado: "Destacado" };

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Texto normalizado para búsquedas (sin acentos, minúsculas). */
export function searchable(s: string): string {
  return slugify(s).replace(/-/g, " ");
}

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const money = (n: number) => ars.format(n);

export function priceShown(p: Product, s: Settings): boolean {
  return s.show_prices && p.price_visible && p.price != null && p.price > 0;
}

export function shortDesc(p: Product, max = 110): string {
  const first = (p.description || "").split(/(?<=\.)\s/)[0] ?? "";
  return first.length > max ? first.slice(0, max - 3).replace(/\s\S*$/, "") + "…" : first;
}

export function inCategory(p: Product, c: Category): boolean {
  return c.is_offers ? p.tag === "oferta" : p.category_id === c.id;
}

export const waDigits = (n: string) => n.replace(/\D/g, "");
export const waLink = (number: string, text: string) =>
  `https://wa.me/${waDigits(number)}?text=${encodeURIComponent(text)}`;

export function formatPhone(n: string): string {
  const d = waDigits(n);
  const m = d.match(/^54(9)(11|\d{3,4})(\d{3,4})(\d{4})$/);
  return m ? `+54 ${m[1]} ${m[2]} ${m[3]}-${m[4]}` : `+${d}`;
}

export const productUrl = (base: string, p: Pick<Product, "slug">) => `${base}/producto/${p.slug}`;

export function msgProduct(base: string, p: Product, variant?: string): string {
  return `Hola, quería consultar por *${p.name}*${variant ? ` (${variant})` : ""} | Código: ${p.sku}\n${productUrl(base, p)}\n\n¿Me podrían pasar una cotización y confirmar disponibilidad? Gracias.`;
}

export type ListItem = { sku: string; variant: string; qty: number; note?: string };

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function msgList(_base: string, items: ListItem[], bySku: Map<string, Product>, note = ""): string {
  const valid = items.filter((i) => bySku.has(i.sku));
  const lines = valid.map((i, n) => {
    const p = bySku.get(i.sku)!;
    const out = [`${n + 1}. *${p.name}*${i.variant ? ` (${i.variant})` : ""}`, `   Código: ${p.sku}  |  Cantidad: ${i.qty}`];
    const obs = i.note?.trim();
    if (obs) out.push(`   Obs.: ${obs.replace(/\s+/g, " ")}`);
    return out.join("\n");
  });
  const units = valid.reduce((a, i) => a + i.qty, 0);
  const general = note.trim();
  return [
    "Hola, quería pedir una cotización de los siguientes productos:",
    lines.join("\n\n"),
    `*Total: ${plural(valid.length, "producto", "productos")} · ${plural(units, "unidad", "unidades")}*`,
    ...(general ? [`*Observaciones:*\n${general}`] : []),
    "¿Me podrían confirmar precio y disponibilidad? Gracias.",
  ].join("\n\n");
}

export const msgGeneral = (name: string) => `Hola, quería hacer una consulta sobre productos de ${name}.`;
export const msgQuote = (name: string) =>
  `Hola, quería pedir una cotización de productos de ${name}.\n\nProductos o códigos (SKU):\nCantidad aproximada:\n¿Con logo? Sí / No`;
export const msgCustom = () =>
  "Hola, quería pedir un presupuesto de productos personalizados con el logo de mi empresa.\n\nProductos que me interesan:\nCantidad aproximada:\nFecha en la que lo necesito:\n\nTe envío el logo por acá.";
