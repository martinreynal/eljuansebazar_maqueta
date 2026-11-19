import { ISO_BOTTOM, ISO_TOP } from "@/lib/logo-paths";
import type { CategoryGroup } from "@/lib/types";

/**
 * Figuras del isotipo de Saggio como superficie de color de los accesos principales.
 * Bazar (verde) = figura superior del logo: borde superior y derecho rectos, curva de 90° que recorta la esquina inferior izquierda.
 * Mobiliario (terracota) = figura inferior: borde izquierdo e inferior rectos, curva de 90° que redondea la esquina superior derecha.
 * Se usan los trazados originales del logo, sin deformar (misma proporción en las dos).
 */
export function GroupShape({ group }: { group: CategoryGroup }) {
  const top = group === "bazar";
  return (
    <svg className={`ch-iso ${top ? "iso-t" : "iso-b"}`} viewBox={top ? "0 0 651.3 322" : "0 341.4 651.3 322"} preserveAspectRatio="xMidYMid meet" aria-hidden focusable="false">
      <path d={top ? ISO_TOP : ISO_BOTTOM} />
    </svg>
  );
}
