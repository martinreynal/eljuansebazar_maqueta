/**
 * Identidad geométrica SAGGIO (modernismo italiano de los 60–70).
 * Composiciones modulares en cuadrícula: cuartos de círculo, semicírculos, círculos, arcos y cuadrados.
 * Cada módulo se escribe como "forma fondo-color figura-color", por ejemplo "q-br forest terra".
 *
 * Formas:  s (cuadrado liso) · q-tl|tr|bl|br (cuarto de círculo con centro en esa esquina)
 *          h-t|r|b|l (semicírculo apoyado en ese lado) · c (círculo) · a-tl|tr|bl|br (arco, cuarto de anillo)
 *          d-tl|tr|bl|br (triángulo: mitad diagonal hacia esa esquina) · v (dos semicírculos enfrentados)
 * Colores: forest, terra, burnt, mustard, cream, ivory, sand, peach (definidos en globals.css como --g-*).
 * Puramente decorativo: siempre aria-hidden.
 */

type Shape = string;

const QUARTER: Record<string, string> = {
  tl: "M0 0H100A100 100 0 0 1 0 100Z",
  tr: "M100 0V100A100 100 0 0 1 0 0Z",
  br: "M100 100H0A100 100 0 0 1 100 0Z",
  bl: "M0 100V0A100 100 0 0 1 100 100Z",
};
const RING: Record<string, string> = {
  tl: "M0 0H100A100 100 0 0 1 0 100V54A54 54 0 0 0 54 0Z",
  tr: "M100 0V100A100 100 0 0 1 0 0H46A54 54 0 0 0 100 54Z",
  br: "M100 100H0A100 100 0 0 1 100 0V46A54 54 0 0 0 46 100Z",
  bl: "M0 100V0A100 100 0 0 1 100 100H54A54 54 0 0 0 0 46Z",
};
const HALF: Record<string, string> = {
  l: "M0 0A50 50 0 0 1 0 100Z",
  r: "M100 100A50 50 0 0 1 100 0Z",
  t: "M100 0A50 50 0 0 1 0 0Z",
  b: "M0 100A50 50 0 0 1 100 100Z",
};
const DIAG: Record<string, string> = {
  tl: "M0 0H100L0 100Z",
  tr: "M0 0H100V100Z",
  br: "M100 0V100H0Z",
  bl: "M0 0L100 100H0Z",
};

function Module({ spec, x, y }: { spec: Shape; x: number; y: number }) {
  const [kind, bg = "ivory", fg = "forest"] = spec.trim().split(/\s+/);
  const [t, dir = ""] = kind.split("-");
  let figure: React.ReactNode = null;
  if (t === "q") figure = <path d={QUARTER[dir] ?? QUARTER.tl} className={`g-${fg}`} />;
  else if (t === "a") figure = <path d={RING[dir] ?? RING.tl} className={`g-${fg}`} />;
  else if (t === "h") figure = <path d={HALF[dir] ?? HALF.b} className={`g-${fg}`} />;
  else if (t === "d") figure = <path d={DIAG[dir] ?? DIAG.tl} className={`g-${fg}`} />;
  else if (t === "c") figure = <circle cx="50" cy="50" r="42" className={`g-${fg}`} />;
  else if (t === "v") figure = <><path d={HALF.l} className={`g-${fg}`} /><path d={HALF.r} className={`g-${fg}`} /></>;
  return (
    <g transform={`translate(${x * 100} ${y * 100})`}>
      <rect width="100" height="100" className={`g-${bg}`} />
      {figure}
    </g>
  );
}

/** Composición en cuadrícula. `rows` es una lista de filas; cada fila, una lista de módulos. */
export function Geo({ rows, className = "", gap = 0 }: { rows: Shape[][]; className?: string; gap?: number }) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const step = 100 + gap;
  return (
    <svg className={`geo ${className}`} viewBox={`0 0 ${w * step - gap} ${h * step - gap}`} aria-hidden focusable="false" preserveAspectRatio="xMidYMid meet">
      {rows.map((r, y) => r.map((m, x) => <Module key={`${x}-${y}`} spec={m} x={(x * step) / 100} y={(y * step) / 100} />))}
    </svg>
  );
}

/* ---------- Composiciones de la marca (reutilizables en toda la web) ---------- */

/** Franja separadora: módulos en una fila (se repite el patrón hasta completar `n`). */
const BAND = ["q-br forest terra", "h-b cream forest", "s mustard", "a-tl ivory terra", "c forest cream", "q-tl terra mustard", "h-t peach forest", "d-br cream burnt", "q-bl forest ivory", "s terra", "h-l mustard forest", "a-br cream forest"];
export function GeoBand({ n = 24, className = "" }: { n?: number; className?: string }) {
  return <Geo className={`geo-band ${className}`} rows={[Array.from({ length: n }, (_, i) => BAND[i % BAND.length])]} />;
}

/** Racimo chico (3×2) para acompañar títulos. */
export function GeoMark({ className = "" }: { className?: string }) {
  return <Geo className={`geo-mark ${className}`} rows={[["q-br ivory forest", "h-b ivory terra", "s mustard"], ["a-tr ivory terra", "c ivory forest", "q-tl ivory burnt"]]} />;
}

/** Bordes laterales de página (se recortan contra el borde de la pantalla; solo en pantallas anchas). */
export function GeoEdges() {
  return (
    <div className="geo-edges" aria-hidden>
      <Geo className="geo-edge l" rows={[["h-r cream terra"], ["q-tr burnt cream"], ["s cream"], ["h-r forest cream"], ["q-bl terra cream"]]} />
      <Geo className="geo-edge r" rows={[["q-bl cream terra"], ["a-tl cream peach"], ["h-l peach cream"]]} />
    </div>
  );
}

/** Panel decorativo 3×3 para banners y secciones institucionales. */
export function GeoPanel({ className = "", variant = "warm" }: { className?: string; variant?: "warm" | "forest" | "terra" }) {
  const sets: Record<string, Shape[][]> = {
    warm: [["q-br cream forest", "h-b mustard cream", "s terra"], ["c forest cream", "a-tl ivory terra", "q-bl peach burnt"], ["h-t terra ivory", "s forest", "q-tl mustard forest"]],
    forest: [["q-br forest terra", "h-b forest cream", "s mustard"], ["c terra forest", "a-tr forest cream", "q-tl cream forest"], ["h-t mustard forest", "q-bl forest peach", "s cream"]],
    terra: [["q-br terra forest", "h-b terra cream", "s mustard"], ["a-tl terra cream", "c forest mustard", "q-bl cream terra"], ["s forest", "h-t mustard terra", "q-tl terra cream"]],
  };
  return <Geo className={`geo-panel ${className}`} rows={sets[variant]} />;
}
