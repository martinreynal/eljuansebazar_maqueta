import { notFound } from "next/navigation";
import { IngesSheet } from "@/components/admin/IngesSheet";
import { getAdmin } from "@/lib/auth";
import type { SourcingRow } from "@/lib/sourcing";
import type { Product } from "@/lib/types";

export const metadata = { title: "Planilla INGES" };
export const dynamic = "force-dynamic";

/** Panel · Planilla de clasificación INGES de un producto, editable y exportable a Excel. */
export default async function PlanillaInges({ params }: { params: Promise<{ id: string }> }) {
  const a = await getAdmin();
  if (a.state !== "admin") return null;
  const { id } = await params;
  const [{ data: p }, { data: s }, { data: all }] = await Promise.all([
    a.sb.from("products").select("id, sku, slug, name, description, images, placeholder, category_id, materials, dimensions, visible, archived, categories(name)").eq("id", id).maybeSingle(),
    a.sb.from("product_sourcing").select("*").eq("product_id", id).maybeSingle(),
    a.sb.from("products").select("id, sku").or("archived.eq.false,archive_bin.eq.archivados").order("sku"),
  ]);
  if (!p) notFound();
  const list = all ?? [];
  const i = list.findIndex((x) => x.id === id);
  const prev = i > 0 ? list[i - 1] : null, next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  const catName = (p as unknown as { categories?: { name: string } | null }).categories?.name ?? "";
  return <IngesSheet key={id} p={p as unknown as Product} catName={catName} row={(s ?? null) as SourcingRow | null} prev={prev} next={next} pos={i + 1} total={list.length} />;
}
