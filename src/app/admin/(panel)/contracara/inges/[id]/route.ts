import sharp from "sharp";
import { getAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/env";
import { buildIngesXlsx, type IngesData } from "@/lib/inges";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Descarga la planilla de clasificación INGES de un producto, completada con su contracara. Solo administradores. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await getAdmin();
  if (a.state !== "admin") return new Response("No autorizado", { status: 401 });
  const { id } = await params;
  const [{ data: p }, { data: s }] = await Promise.all([
    a.sb.from("products").select("sku, name, description, images, materials").eq("id", id).maybeSingle(),
    a.sb.from("product_sourcing").select("*").eq("product_id", id).maybeSingle(),
  ]);
  if (!p) return new Response("Producto no encontrado", { status: 404 });
  const r = (s ?? {}) as Partial<IngesData>;
  const d: IngesData = {
    inges_order: r.inges_order ?? "", customs_name: r.customs_name || p.name, customs_description: r.customs_description || p.description || "",
    origin: r.origin ?? "", operating_details: r.operating_details ?? "", material_composition: r.material_composition ?? "", sample: r.sample ?? "", customs_notes: r.customs_notes ?? "",
    total_pcs: r.total_pcs ?? null, units_per_box: r.units_per_box ?? null, total_cartons: r.total_cartons ?? null, box_dimensions: r.box_dimensions ?? "", total_cbm: r.total_cbm ?? null,
    cost: r.cost ?? null, currency: r.currency ?? "USD", fob_djai: r.fob_djai ?? null, net_weight_g: r.net_weight_g ?? null,
    shipping_mode: r.shipping_mode ?? "", loading_port: r.loading_port ?? "", lead_time: r.lead_time ?? "",
  };

  // Foto principal, convertida a JPG cuadrado con fondo blanco (Excel no admite WebP)
  let photo: { data: Buffer; px: number } | null = null;
  const img = (p.images as string[] | null)?.[0];
  if (img) {
    try {
      const url = img.startsWith("/") ? new URL(img, req.url).toString() : mediaUrl(img);
      const res = url ? await fetch(url, { cache: "no-store" }) : null;
      if (res?.ok) {
        const data = await sharp(Buffer.from(await res.arrayBuffer())).resize(600, 600, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer();
        photo = { data, px: 600 };
      }
    } catch { /* sin foto: la planilla sale igual */ }
  }

  const file = await buildIngesXlsx(d, photo);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Clasificacion_INGES_${p.sku}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
