import { artSvg, customArtSvg } from "@/lib/art";
import type { CustomPlaceholder, Placeholder } from "@/lib/types";

export function Art({ ph, name, view = 0, label = true }: { ph: Placeholder | null; name: string; view?: number; label?: boolean }) {
  return <span className="svg-box" dangerouslySetInnerHTML={{ __html: artSvg(ph, name, view, label) }} />;
}

export function CustomArt({ ph }: { ph: CustomPlaceholder }) {
  return <span className="svg-box" dangerouslySetInnerHTML={{ __html: customArtSvg(ph) }} />;
}
