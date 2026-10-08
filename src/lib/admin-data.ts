import "server-only";
import { DESIGN_DEFAULTS } from "./data";
import { requireAdmin } from "./auth";
import type { Category, CustomWork, Faq, Product, Settings } from "./types";

/** Datos completos para el panel (incluye ocultos, archivados y categorías inactivas). */
export async function adminData() {
  const sb = await requireAdmin();
  const [p, c, s, f, w] = await Promise.all([
    sb.from("products").select("*").order("created_at", { ascending: false }),
    sb.from("categories").select("*").order("position"),
    sb.from("settings").select("*").eq("id", 1).single(),
    sb.from("faqs").select("*").order("position"),
    sb.from("custom_works").select("*").order("position"),
  ]);
  const err = p.error || c.error || s.error || f.error || w.error;
  if (err) throw new Error(err.message);
  const settings = s.data as Settings;
  settings.design = { ...DESIGN_DEFAULTS, ...(settings.design ?? {}) };
  return {
    products: (p.data as Product[]).map((x) => ({ ...x, price: x.price == null ? null : Number(x.price), old_price: x.old_price == null ? null : Number(x.old_price) })),
    categories: c.data as Category[],
    settings,
    faqs: f.data as Faq[],
    works: w.data as CustomWork[],
  };
}
