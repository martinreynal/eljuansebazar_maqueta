import Image from "next/image";
import { isLocalImage, mediaUrl, miniImage } from "@/lib/env";
import type { Product } from "@/lib/types";
import { Art } from "./Art";

/** Foto del producto (si se cargó) o dibujo ilustrativo. */
export function ProductImage({
  p, view = 0, label = true, sizes = "(max-width: 720px) 50vw, 25vw", priority = false, full = false, hiRes = false,
}: { p: Pick<Product, "images" | "placeholder" | "name">; view?: number; label?: boolean; sizes?: string; priority?: boolean; full?: boolean; hiRes?: boolean }) {
  const raw = p.images.length ? p.images[Math.min(view, p.images.length - 1)] : null;
  const local = raw ? isLocalImage(raw) : false;
  const src = raw ? (local && !full && !hiRes ? miniImage(raw) : mediaUrl(raw)) : null;
  // Ficha de producto con foto del catálogo: se muestra a su tamaño real como máximo (sin estirarla), para que no se vea borrosa
  if (src && local && full)
    return (
      <span className="native-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={p.name} fetchPriority={priority ? "high" : undefined} decoding="async" />
      </span>
    );
  if (src)
    return (
      <span className="media-fill">
        {/* Las fotos del catálogo ya vienen optimizadas: se sirven tal cual */}
        <Image src={src} alt={p.name} fill sizes={sizes} priority={priority} unoptimized={local} style={hiRes ? { objectFit: "contain" } : undefined} />
      </span>
    );
  return <Art ph={p.placeholder} name={p.name} view={view} label={label} />;
}
