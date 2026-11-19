"use client";
import { ArrowRight, Check } from "lucide-react";
import type { CategoryGroup } from "@/lib/types";
import { WORDMARK } from "@/lib/logo-paths";
import { GroupShape } from "./GroupShape";

const BANNERS: { key: CategoryGroup; name: string; line: string; img: string; pos: string; tone: "forest" | "terra" }[] = [
  { key: "bazar", name: "Bazar", line: "Vajilla, cristalería y equipamiento profesional", img: "/catalogo-grupos/bazar.jpg", pos: "45% 60%", tone: "forest" },
  { key: "mobiliario", name: "Mobiliario", line: "Muebles para restaurantes, hoteles y más", img: "/catalogo-grupos/mobiliario.jpg", pos: "50% 55%", tone: "terra" },
];

/** Póster geométrico de la marca (verde bosque y terracota sobre crema) con el logotipo SAGGIO. Llena el panel. */
function HeroPoster() {
  const F = "#1E4D3D", T = "#C96F4A", C = "#F8ECE1";
  return (
    <svg className="hh-poster" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Saggio">
      <rect width="600" height="400" fill={C} />
      <circle cx="600" cy="230" r="150" fill={T} />
      <rect width="100" height="100" fill={T} />
      <path d="M100 0A100 100 0 0 0 200 100A100 100 0 0 0 100 0Z" fill={F} />
      <path d="M300 100H200A100 100 0 0 1 300 0Z" fill={F} />
      <path d="M400 100A100 100 0 0 1 600 100Z" fill={F} />
      <path d="M100 100V200H0A100 100 0 0 0 100 100Z" fill={T} />
      <path d="M100 100H200A100 100 0 0 1 100 200Z" fill={F} />
      <path d="M200 100H300A100 100 0 0 1 200 200Z" fill={T} />
      <rect x="300" y="100" width="100" height="100" fill={F} />
      <path d="M400 200H300A100 100 0 0 1 400 100Z" fill={C} />
      <path d="M0 200A100 100 0 0 1 0 400Z" fill={F} />
      <path d="M300 200A100 100 0 0 0 400 300A100 100 0 0 0 300 200Z" fill={T} />
      <rect x="400" y="200" width="100" height="100" fill={C} />
      <path d="M400 300A100 100 0 0 1 500 200V300Z" fill={F} />
      <path d="M305 400A95 95 0 0 1 400 305V400Z" fill={T} />
      <path d="M400 300H500A100 100 0 0 1 400 400Z" fill={F} />
      <rect x="500" y="300" width="100" height="100" fill={T} />
      <path d="M500 300A100 100 0 0 1 600 400H500Z" fill={F} />
      <g transform="translate(112 326) scale(0.145)"><path fill={F} fillRule="evenodd" d={WORDMARK} /></g>
    </svg>
  );
}

/**
 * Portada: panel de presentación (texto + composición geométrica) y los dos accesos, Bazar y Mobiliario,
 * con las figuras del isotipo. Los accesos eligen el grupo: debajo aparecen sus categorías (misma dinámica del catálogo).
 */
export function HomeHero({ group, onGroup }: { group: CategoryGroup | "todo"; onGroup: (g: CategoryGroup | "todo") => void }) {
  return (
    <section className="hh" aria-label="Presentación">
      <div className="hh-art hh-art-poster">
        <h1 className="sr-only">Saggio · Equipamiento profesional para la hospitalidad: mobiliario, vajilla, cristalería y bazar para hoteles y restaurantes</h1>
        <HeroPoster />
      </div>
      <div className={`hh-banners ch-banners${group !== "todo" ? " picked" : ""}`} role="tablist" aria-label="Grupos del catálogo">
        {BANNERS.map((b) => {
          const on = group === b.key;
          return (
            <button key={b.key} type="button" role="tab" aria-selected={on} className={`ch-banner ${b.tone}${on ? " on" : ""}`} onClick={() => onGroup(on ? "todo" : b.key)}>
              <img className="ch-banner-img" src={b.img} alt="" loading="eager" decoding="async" style={{ objectPosition: b.pos }} />
              <GroupShape group={b.key} />
              <span className="ch-banner-t">
                <b>{b.name}</b>
                <small>{b.line}</small>
                <span className="ch-go" aria-hidden>{on ? <Check /> : <ArrowRight />}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
