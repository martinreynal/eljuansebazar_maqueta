import { notFound } from "next/navigation";
import { SHOW_GAME } from "@/lib/features";
import { SaggioGame } from "@/components/admin/SaggioGame";
import { adminData } from "@/lib/admin-data";
import { isLocalImage, mediaUrl, miniImage } from "@/lib/env";
import { saggioRanking } from "@/app/admin/saggio-actions";

/** Productos del carrusel de la portada: aparecen como pieza dorada (x3). */
const STARS = new Set(["SIL-012", "SOF-016", "BAN-009", "BOX-010", "MES-010", "EXT-018", "EXT-011"]);

export const metadata = { title: "sagg.io" };
export const dynamic = "force-dynamic";

/** Jueguito interno del panel: revolear sillas y mesas del catálogo. */
export default async function SaggioAdmin() {
  if (!SHOW_GAME) notFound(); // oculto provisoriamente (src/lib/features.ts)
  const { products, categories } = await adminData();
  const furniture = new Set(categories.filter((c) => ["sillas", "mesas", "banquetas", "sofas-y-sillones", "boxes-y-bancos", "exterior", "exterior-lounge", "sets"].includes(c.slug)).map((c) => c.id));
  const pieces = products
    .filter((p) => !p.archived && p.category_id && furniture.has(p.category_id) && p.images[0])
    .map((p) => {
      const slug = categories.find((c) => c.id === p.category_id)?.slug ?? "";
      const n = p.name.toLowerCase();
      const kind: "silla" | "mesa" | "banqueta" | "pesado" = slug === "mesas" || n.startsWith("mesa") ? "mesa" : slug === "banquetas" || n.startsWith("banqueta") ? "banqueta" : /sof|sill[oó]n|box|set|reposera|camastro|daybed/.test(n) || ["sofas-y-sillones", "boxes-y-bancos", "sets", "exterior-lounge"].includes(slug) ? "pesado" : "silla";
      return { name: p.name, kind, golden: STARS.has(p.sku), fragile: /esterilla|ratán|ratan|mimbre|vidrio/i.test(`${p.name} ${p.description}`), img: isLocalImage(p.images[0]) ? miniImage(p.images[0]) : mediaUrl(p.images[0])! };
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, 160);
  const ranking = await saggioRanking();
  return <SaggioGame pieces={pieces} ranking={ranking} />;
}
