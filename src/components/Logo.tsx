/* eslint-disable @next/next/no-img-element */

/**
 * Logo SAGGIO: isotipo (S de tres trazos en azul petróleo, verde profundo y
 * naranja) + nombre en Montserrat Bold y bajada "Equipamiento gastronómico".
 * El isotipo es vectorial (/isotipo-saggio.svg), así se ve nítido a cualquier tamaño.
 */
export function Logo({ name, tagline = "Equipamiento gastronómico", priority = false, compact = false }: { name: string; tagline?: string; priority?: boolean; compact?: boolean }) {
  return (
    <span className={`lockup ${compact ? "lockup-compact" : ""}`} aria-label={name}>
      <img className="lockup-iso" src="/isotipo-saggio.svg" alt="" width={44} height={44} fetchPriority={priority ? "high" : undefined} />
      <span className="lockup-text">
        <span className="lockup-name">SAGGIO</span>
        {!compact && tagline && <span className="lockup-tag">{tagline}</span>}
      </span>
    </span>
  );
}
