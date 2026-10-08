import { cache } from "react";
import { demoStore } from "./demo";
import { hasSupabase } from "./env";
import { publicClient } from "./supabase/public";
import type { Category, CustomWork, Design, Faq, Product, Settings, StoreData } from "./types";

const DESIGN_DEFAULTS: Design = demoStore().settings.design;


/**
 * Carga todo lo que la tienda pública necesita en una sola pasada.
 * Las políticas de Supabase ya filtran lo no publicado; acá además se ocultan
 * los productos de categorías desactivadas.
 */
export const getStore = cache(async (): Promise<StoreData> => {
  if (!hasSupabase) return demoStore();
  const sb = publicClient();
  const [s, c, p, f, w] = await Promise.all([
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("categories").select("*").order("position"),
    sb.from("products").select("*").order("created_at", { ascending: false }),
    sb.from("faqs").select("*").order("position"),
    sb.from("custom_works").select("*").order("position"),
  ]);
  const err = s.error || c.error || p.error || f.error || w.error;
  if (err) throw new Error(`No se pudieron leer los datos de Supabase: ${err.message}`);
  if (!s.data) throw new Error("Falta la fila de configuración (tabla settings). Ejecutá 0002_datos_demo.sql o cargala desde el panel.");

  const categories = (c.data ?? []) as Category[];
  const active = new Set(categories.filter((x) => x.active).map((x) => x.id));
  const products = ((p.data ?? []) as Product[])
    .map((x) => ({ ...x, price: x.price == null ? null : Number(x.price), old_price: x.old_price == null ? null : Number(x.old_price) }))
    .filter((x) => x.category_id && active.has(x.category_id));
  const settings = s.data as Settings;
  settings.design = { ...DESIGN_DEFAULTS, ...(settings.design ?? {}) };

  return {
    settings,
    categories: categories.filter((x) => x.active),
    products,
    faqs: (f.data ?? []) as Faq[],
    customWorks: (w.data ?? []) as CustomWork[],
    demo: false,
  };
});

export { DESIGN_DEFAULTS };

/** IDs de los productos más consultados por WhatsApp (últimos 90 días). */
export const getTopProductIds = cache(async (): Promise<string[]> => {
  if (!hasSupabase) return [];
  const { data, error } = await publicClient().rpc("top_products", { days: 90, lim: 6 });
  if (error) return [];
  return ((data ?? []) as { product_id: string }[]).map((r) => r.product_id);
});
