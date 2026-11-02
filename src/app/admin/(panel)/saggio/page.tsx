import { SaggioGame } from "@/components/admin/SaggioGame";
import { adminData } from "@/lib/admin-data";
import { isLocalImage, mediaUrl, miniImage } from "@/lib/env";

export const metadata = { title: "sagg.io" };
export const dynamic = "force-dynamic";

/** Jueguito interno del panel: revolear sillas y mesas del catálogo. */
export default async function SaggioAdmin() {
  const { products, categories } = await adminData();
  const furniture = new Set(categories.filter((c) => ["sillas", "mesas", "banquetas", "sofas-y-sillones", "boxes-y-bancos", "exterior", "exterior-lounge", "sets"].includes(c.slug)).map((c) => c.id));
  const pieces = products
    .filter((p) => !p.archived && p.category_id && furniture.has(p.category_id) && p.images[0])
    .map((p) => {
      const slug = categories.find((c) => c.id === p.category_id)?.slug ?? "";
      const n = p.name.toLowerCase();
      const kind: "silla" | "mesa" | "banqueta" | "pesado" = slug === "mesas" || n.startsWith("mesa") ? "mesa" : slug === "banquetas" || n.startsWith("banqueta") ? "banqueta" : /sof|sill[oó]n|box|set|reposera|camastro|daybed/.test(n) || ["sofas-y-sillones", "boxes-y-bancos", "sets", "exterior-lounge"].includes(slug) ? "pesado" : "silla";
      return { name: p.name, kind, img: isLocalImage(p.images[0]) ? miniImage(p.images[0]) : mediaUrl(p.images[0])! };
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, 120);
  return <SaggioGame pieces={pieces} />;
}
