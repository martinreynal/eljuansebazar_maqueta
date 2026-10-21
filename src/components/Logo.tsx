/**
 * Logo SAGGIO: isotipo (S geométrica de dos piezas) + nombre en Playfair Display, en rojo #EF241E.
 * Ambos son vectoriales/texto: nítidos en cualquier tamaño.
 */
export function Logo({ name, compact = false }: { name: string; tagline?: string; priority?: boolean; compact?: boolean }) {
  return (
    <span className={`lockup ${compact ? "lockup-compact" : ""}`} aria-label={name}>
      <svg className="lockup-iso" viewBox="0 0 487 582" aria-hidden focusable="false">
        <path d="M21 0H487V277H298A277 277 0 0 1 21 0Z" />
        <path d="M0 287H164A295 295 0 0 1 459 582H0Z" />
      </svg>
      <span className="lockup-word" aria-hidden>SAGGIO</span>
    </span>
  );
}
