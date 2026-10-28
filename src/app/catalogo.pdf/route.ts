import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { artSvg } from "@/lib/art";
import { getStore } from "@/lib/data";
import { isLocalImage, mediaUrl, miniImage, siteUrl } from "@/lib/env";
import { CatalogPdf, type PdfImages } from "@/lib/pdf";

// El PDF se regenera solo: como máximo cada hora, y al instante cuando se guarda algo en el panel.
export const revalidate = 3600;
export const runtime = "nodejs";
export const maxDuration = 60;

/** Achica cada foto para el PDF (miniatura liviana) y así el archivo no supera el límite de Vercel. */
async function thumb(buf: Buffer): Promise<Buffer> {
  try {
    return await sharp(buf).rotate().resize(280, 280, { fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 66, mozjpeg: true }).toBuffer();
  } catch {
    return buf;
  }
}

async function productImage(p: { images: string[]; placeholder: Parameters<typeof artSvg>[0]; name: string }): Promise<Buffer | string | undefined> {
  const first = p.images[0];
  if (first && isLocalImage(first)) {
    // Foto del catálogo incluida en la web: se usa la versión chica para que el PDF no pese de más
    try {
      return await thumb(await readFile(path.join(process.cwd(), "public", miniImage(first))));
    } catch { /* si falta el archivo, se usa el dibujo */ }
  }
  const url = first && !isLocalImage(first) ? mediaUrl(first) : null;
  if (url) {
    try {
      const res = await fetch(url);
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && /jpe?g|png|webp/.test(type)) return await thumb(Buffer.from(await res.arrayBuffer()));
    } catch { /* si falla la foto, se usa el dibujo */ }
  }
  try {
    const svg = artSvg(p.placeholder, p.name, 0, false).replace('preserveAspectRatio="xMidYMid slice"', "");
    return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 480 } }).render().asPng());
  } catch {
    return undefined;
  }
}

export async function GET() {
  const data = await getStore();
  const base = siteUrl(data.settings.site_url);
  const byProduct = new Map<string, Buffer | string>();
  await Promise.all(
    data.products.map(async (p) => {
      const img = await productImage(p);
      if (img) byProduct.set(p.id, img);
    }),
  );
  let logo: Buffer | undefined;
  try { logo = await readFile(path.join(process.cwd(), "public", "logo-saggio.png")); } catch { logo = undefined; }
  const images: PdfImages = { logo, byProduct };
  const doc = createElement(CatalogPdf, { data, images, base }) as unknown as ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(doc);
  const file = `catalogo-${data.settings.business_name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${file}"`,
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
