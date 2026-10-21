/**
 * Logo SAGGIO (manual de marca 2026): nombre en Playfair Display, azul petróleo,
 * con la bajada "Equipamiento gastronómico" en Montserrat espaciada.
 * Es texto real (no imagen): nítido en cualquier tamaño y en cualquier pantalla.
 */
export function Logo({ name, tagline = "Equipamiento gastronómico", compact = false }: { name: string; tagline?: string; priority?: boolean; compact?: boolean }) {
  return (
    <span className={`lockup ${compact ? "lockup-compact" : ""}`} aria-label={name}>
      <span className="lockup-word" aria-hidden>SAGGIO</span>
      {!compact && tagline && <span className="lockup-tag" aria-hidden>{tagline}</span>}
    </span>
  );
}
