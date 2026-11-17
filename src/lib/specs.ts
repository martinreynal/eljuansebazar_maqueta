import { norm } from "./product-order";
import type { Product } from "./types";

/**
 * Datos para la ficha de producto, armados solo con lo que ya está cargado (descripción, material y medidas).
 * Nada se inventa: si un dato no figura, no se muestra.
 */

export type FeatureKey = "microondas" | "horno" | "lavavajillas" | "apilable" | "exterior" | "tapizado" | "personalizable" | "profesional";
export const FEATURE_LABEL: Record<FeatureKey, string> = {
  microondas: "Apto microondas",
  horno: "Apto horno",
  lavavajillas: "Apto lavavajillas",
  apilable: "Apilable",
  exterior: "Uso exterior",
  tapizado: "Tapizado",
  personalizable: "Personalizable",
  profesional: "Uso profesional",
};

/** Características principales con ícono (máximo 4), según el texto del producto. */
export function featuresOf(p: Product, group: "bazar" | "mobiliario" | null): FeatureKey[] {
  const t = norm(`${p.name} ${p.description} ${p.materials}`);
  const out: FeatureKey[] = [];
  const no = (w: string) => new RegExp(`\\bno (es )?apt[oa]s? (para )?(el |uso en )?${w}`).test(t);
  if (/microondas/.test(t) && !no("microondas")) out.push("microondas");
  if (/\bhorno\b/.test(t) && !no("horno")) out.push("horno");
  if (/lavavajilla/.test(t) && !no("lavavajilla")) out.push("lavavajillas");
  if (/apilable/.test(t)) out.push("apilable");
  if (/exterior|intemperie/.test(t)) out.push("exterior");
  if (/tapizad/.test(t)) out.push("tapizado");
  if (out.length < 4 && (group === "bazar" || /gastronom|restaurant|hotel/.test(t)) && (out.length || /restaurant|hotel/.test(t))) out.push("profesional");
  if (/personaliza/.test(t)) out.push("personalizable");
  return out.slice(0, 4);
}

export type Spec = { label: string; value: string };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const clean = (s: string) => s.replace(/^(de|del)\s+/i, "").replace(/\s+/g, " ").trim();

/**
 * Especificaciones básicas (horizontales, debajo de las características).
 * Interpreta las medidas cargadas: "Ø 28 cm · base Ø 20,5 cm · alto 2,3 cm", "31.5x14 cm", "250 ml", "13 cm".
 */
export function specsOf(p: Product, catSlug?: string): Spec[] {
  const out: Spec[] = [];
  const parts = (p.dimensions || "").split(/\s*[·;|]\s*/).map((s) => s.trim()).filter(Boolean);
  const n = norm(p.name);
  for (const raw of parts) {
    const s = norm(raw);
    const val = (x: string) => clean(x.replace(/^(base|alto|altura|ancho|largo|profundidad|diametro|capacidad|asiento)\s*:?\s*/i, "").replace(/^Ø\s*/, ""));
    if (/^base\b/.test(s)) out.push({ label: "Base", value: val(raw.replace(/^base\s*/i, "")).replace(/^Ø\s*/, "") });
    else if (/^(alto|altura)\b/.test(s)) out.push({ label: "Altura", value: val(raw) });
    else if (/^ancho\b/.test(s)) out.push({ label: "Ancho", value: val(raw) });
    else if (/^(largo)\b/.test(s)) out.push({ label: "Largo", value: val(raw) });
    else if (/^profundidad\b/.test(s)) out.push({ label: "Profundidad", value: val(raw) });
    else if (/^asiento\b/.test(s)) out.push({ label: "Altura de asiento", value: val(raw) });
    else if (/^(ø|diametro)/.test(s) || raw.startsWith("Ø")) out.push({ label: "Diámetro", value: val(raw) });
    else if (/\b(ml|cc|oz|l|litros?)\b/.test(s)) out.push({ label: "Capacidad", value: raw });
    else if (/\d\s*[x×]\s*\d/.test(s)) out.push({ label: "Medidas", value: raw.replace(/\s*[x×]\s*/g, " × ") });
    else if (/^\d+([.,]\d+)?\s*(cm|mm|m)$/.test(s)) {
      // Una sola medida: diámetro en platos y bowls redondos, largo en cubiertos y utensilios
      const label = /^(plato|bowl|bol|cuenco|fuente redonda|taza|platito)/.test(n) && !/rectangular|cuadrad|oval/.test(n) ? "Diámetro"
        : catSlug === "cubiertos" || /^(cuchar|tenedor|cuchillo|utensilio|set de \d+ (cucharas|utensilios|tenedores|cuchillos))/.test(n) ? "Largo" : "Medida";
      out.push({ label, value: raw });
    } else out.push({ label: "Medidas", value: raw });
  }
  if (p.materials) out.push({ label: "Material", value: cap(p.materials) });
  return out;
}
