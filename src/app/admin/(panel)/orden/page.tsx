import { DisplayOrderEditor } from "@/components/admin/DisplayOrderEditor";
import { getAdmin } from "@/lib/auth";
import { DESIGN_DEFAULTS } from "@/lib/data";
import { siteUrl } from "@/lib/env";
import type { Category, Product, Settings } from "@/lib/types";

export const metadata = { title: "Orden de visualización" };
export const dynamic = "force-dynamic";

/** Panel · Orden de visualización: cómo se ven y en qué orden los productos de cada categoría en el catálogo público. */
export default async function OrdenAdmin() {
  const a = await getAdmin();
  if (a.state !== "admin") return null;
  const [c, p, s] = await Promise.all([
    a.sb.from("categories").select("*").eq("active", true).eq("is_offers", false).order("position"),
    a.sb.from("products").select("*").eq("visible", true).eq("archived", false).order("created_at", { ascending: false }),
    a.sb.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const products = ((p.data ?? []) as Product[]).filter((x) => !x.staged).map((x) => ({ ...x, price: x.price == null ? null : Number(x.price), old_price: x.old_price == null ? null : Number(x.old_price) }));
  const categories = ((c.data ?? []) as Category[]).filter((x) => products.some((y) => y.category_id === x.id));
  const settings = { ...(s.data as Settings), design: { ...DESIGN_DEFAULTS, ...((s.data as Settings | null)?.design ?? {}) } } as Settings;
  return <DisplayOrderEditor categories={categories} products={products} settings={settings} base={siteUrl(settings.site_url)} />;
}
