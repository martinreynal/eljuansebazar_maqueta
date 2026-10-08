import Image from "next/image";
import { mediaUrl } from "@/lib/env";
import type { Product } from "@/lib/types";
import { Art } from "./Art";

/** Foto del producto (si se cargó) o dibujo ilustrativo. */
export function ProductImage({
  p, view = 0, label = true, sizes = "(max-width: 720px) 50vw, 25vw", priority = false,
}: { p: Pick<Product, "images" | "placeholder" | "name">; view?: number; label?: boolean; sizes?: string; priority?: boolean }) {
  const src = p.images.length ? mediaUrl(p.images[Math.min(view, p.images.length - 1)]) : null;
  if (src)
    return (
      <span className="media-fill">
        <Image src={src} alt={p.name} fill sizes={sizes} priority={priority} />
      </span>
    );
  return <Art ph={p.placeholder} name={p.name} view={view} label={label} />;
}
