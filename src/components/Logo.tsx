import Image from "next/image";
import { BRAND_LOGO } from "@/lib/brand";

/**
 * Logo SAGGIO. Si existe el archivo del logo (BRAND_LOGO), se muestra la imagen;
 * mientras tanto, el nombre como marca tipográfica en Montserrat.
 */
export function Logo({ name, priority = false }: { name: string; priority?: boolean }) {
  if (BRAND_LOGO) {
    return <Image className="logo-img" src={BRAND_LOGO.src} alt={name} width={BRAND_LOGO.width} height={BRAND_LOGO.height} priority={priority} />;
  }
  return (
    <span className="wordmark" aria-label={name}>
      SAGGIO
    </span>
  );
}
