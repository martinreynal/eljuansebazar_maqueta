import { SourcingTable, type SourcingRow } from "@/components/admin/SourcingTable";
import { getAdmin } from "@/lib/auth";
import type { Category, Product } from "@/lib/types";

export const metadata = { title: "Contracara de productos" };
export const dynamic = "force-dynamic";

/** Panel · Contracara: datos internos de compra y logística de cada producto (no se publican). */
export default async function ContracaraAdmin() {
  const a = await getAdmin();
  if (a.state !== "admin") return null;
  const [p, c, s] = await Promise.all([
    a.sb.from("products").select("id, sku, slug, name, images, placeholder, category_id, materials, dimensions, visible, staged").eq("archived", false).order("sku"),
    a.sb.from("categories").select("*").order("position"),
    a.sb.from("product_sourcing").select("*"),
  ]);
  return <SourcingTable products={(p.data ?? []) as Product[]} categories={(c.data ?? []) as Category[]} rows={(s.data ?? []) as SourcingRow[]} />;
}
