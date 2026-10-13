import Image from "next/image";
import { isLocalImage, mediaUrl, miniImage } from "@/lib/env";
import type { Product } from "@/lib/types";
import { Art } from "./Art";

/** Foto del producto (si se cargó) o dibujo ilustrativo. */
export function ProductImage({
  p, view = 0, label = true, sizes = "(max-width: 720px) 50vw, 25vw", priority = false, full = false,
}: { p: Pick<Product, "images" | "placeholder" | "name">; view?: number; label?: boolean; sizes?: string; priority?: boolean; full?: boolean }) {
  const raw = p.images.length ? p.images[Math.min(view, p.images.length - 1)] : null;
  const local = raw ? isLocalImage(raw) : false;
  const src = raw ? (local && !full ? miniImage(raw) : mediaUrl(raw)) : null;
  if (src)
    return (
      <span className="media-fill">
        {/* Las fotos del catálogo ya vienen optimizadas: se sirven tal cual */}
        <Image src={src} alt={p.name} fill sizes={sizes} priority={priority} unoptimized={local} />
      </span>
    );
  return <Art ph={p.placeholder} name={p.name} view={view} label={label} />;
}
