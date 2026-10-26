import { ISO_BOTTOM, ISO_TOP, ISO_VB, WORD_VB, WORDMARK } from "@/lib/logo-paths";

/** Isotipo bicolor (verde bosque arriba, terracota abajo). */
export function Isotype({ className = "lockup-iso" }: { className?: string }) {
  return (
    <svg className={className} viewBox={ISO_VB} aria-hidden focusable="false">
      <path className="iso-top" d={ISO_TOP} />
      <path className="iso-bottom" d={ISO_BOTTOM} />
    </svg>
  );
}

export function Logo({ name, compact = false }: { name: string; tagline?: string; priority?: boolean; compact?: boolean }) {
  return (
    <span className={`lockup ${compact ? "lockup-compact" : ""}`} role="img" aria-label={name}>
      <Isotype />
      <svg className="lockup-word" viewBox={WORD_VB} aria-hidden focusable="false">
        <path fillRule="evenodd" d={WORDMARK} />
      </svg>
    </span>
  );
}
