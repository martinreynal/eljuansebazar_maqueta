/* eslint-disable @next/next/no-img-element */

/**
 * Logo SAGGIO: isotipo (esfera de tres trazos en azul, naranja y verde) y
 * nombre tomados del logo oficial (/isotipo-saggio.png y /wordmark-saggio.png,
 * con fondo transparente); la bajada "Equipamiento gastronómico" se compone en
 * Montserrat para poder ocultarla en pantallas chicas.
 */
export function Logo({ name, tagline = "Equipamiento gastronómico", priority = false, compact = false }: { name: string; tagline?: string; priority?: boolean; compact?: boolean }) {
  return (
    <span className={`lockup ${compact ? "lockup-compact" : ""}`} aria-label={name}>
      <img className="lockup-iso" src="/isotipo-saggio.png" alt="" width={512} height={512} fetchPriority={priority ? "high" : undefined} />
      <span className="lockup-text">
        <img className="lockup-name" src="/wordmark-saggio.png" alt="SAGGIO" width={1099} height={185} fetchPriority={priority ? "high" : undefined} />
        {!compact && tagline && <span className="lockup-tag">{tagline}</span>}
      </span>
    </span>
  );
}
