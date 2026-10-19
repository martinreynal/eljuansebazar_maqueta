import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Trae una imagen externa (resultado de Google Lens) para que el panel pueda
 * procesarla y subirla. Solo para administradores; solo https y solo imágenes.
 */
export async function GET(req: NextRequest) {
  const a = await getAdmin();
  if (a.state !== "admin") return new NextResponse("No autorizado", { status: 401 });
  const raw = req.nextUrl.searchParams.get("url") ?? "";
  let url: URL;
  try { url = new URL(raw); } catch { return new NextResponse("URL inválida", { status: 400 }); }
  const host = url.hostname;
  const privateHost = host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) || host.endsWith(".internal") || host.includes(":");
  if (url.protocol !== "https:" || privateHost) return new NextResponse("URL no permitida", { status: 400 });
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (SAGGIO panel)", Accept: "image/*" } });
    const type = r.headers.get("content-type") ?? "";
    if (!r.ok || !type.startsWith("image/")) return new NextResponse("No es una imagen", { status: 415 });
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 15 * 1024 * 1024) return new NextResponse("La imagen es demasiado pesada", { status: 413 });
    return new NextResponse(buf, { headers: { "Content-Type": type, "Cache-Control": "private, no-store" } });
  } catch {
    return new NextResponse("No se pudo descargar la imagen", { status: 502 });
  }
}
