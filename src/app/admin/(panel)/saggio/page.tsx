import { SaggioGame } from "@/components/admin/SaggioGame";
import { adminData } from "@/lib/admin-data";
import { isLocalImage, mediaUrl, miniImage } from "@/lib/env";

export const metadata = { title: "sagg.io" };

/** Jueguito interno del panel: revolear sillas y mesas del catálogo. */
export default async function SaggioAdmin() {
  const { products, categories } = await adminData();
  const furniture = new Set(categories.filter((c) => ["sillas", "mesas", "banquetas", "sofas-y-sillones", "boxes-y-bancos", "exterior", "exterior-lounge", "sets"].includes(c.slug)).map((c) => c.id));
  const pieces = products
    .filter((p) => !p.archived && p.category_id && furniture.has(p.category_id) && p.images[0])
    .map((p) => ({ name: p.name, img: isLocalImage(p.images[0]) ? miniImage(p.images[0]) : mediaUrl(p.images[0])! }))
    .slice(0, 120);
  return <SaggioGame pieces={pieces} />;
}
