"use client";
import { ArrowRight, Check } from "lucide-react";
import type { CategoryGroup } from "@/lib/types";
import { GroupShape } from "./GroupShape";
import { WaLink } from "./WaLink";

const BANNERS: { key: CategoryGroup; name: string; line: string; img: string; pos: string; tone: "forest" | "terra" }[] = [
  { key: "bazar", name: "Bazar", line: "Vajilla, cristalería y equipamiento profesional", img: "/catalogo-grupos/bazar.jpg", pos: "45% 60%", tone: "forest" },
  { key: "mobiliario", name: "Mobiliario", line: "Muebles para restaurantes, hoteles y más", img: "/catalogo-grupos/mobiliario.jpg", pos: "50% 55%", tone: "terra" },
];

/** Composición geométrica del panel de presentación, con los colores del logo (verde bosque y terracota sobre crema). */
function HeroArt() {
  return (
    <svg className="hh-art-svg" viewBox="0 0 712 740" preserveAspectRatio="xMaxYMid slice" aria-hidden focusable="false">
      <defs>
        <radialGradient id="hh-cream" cx="38%" cy="40%" r="62%">
          <stop offset="0" stopColor="#FCF4EC" />
          <stop offset=".62" stopColor="#F9EAE0" />
          <stop offset="1" stopColor="#EDC3AE" />
        </radialGradient>
      </defs>
      <rect x="-800" width="1512" height="740" fill="#C96F4A" />
      <circle cx="-40" cy="760" r="300" fill="#1E4D3D" />
      <circle cx="520" cy="-10" r="232" fill="#1E4D3D" />
      <circle cx="455" cy="720" r="200" fill="#E3A68C" />
      <circle cx="292" cy="392" r="378" fill="url(#hh-cream)" />
    </svg>
  );
}

/** Columna de módulos del borde derecho del panel (ancho fijo; se estira en alto). */
function HeroColumn() {
  return (
    <svg className="hh-col" viewBox="0 0 132 740" preserveAspectRatio="none" aria-hidden focusable="false">
      <rect width="132" height="290" fill="#C96F4A" />
      <path d="M132 92V290H0A132 198 0 0 1 132 92Z" fill="#1E4D3D" />
      <rect y="290" width="132" height="256" fill="#F5E4DA" />
      <path d="M132 290V546A132 128 0 0 1 0 418A132 128 0 0 1 132 290Z" fill="#C96F4A" />
      <rect y="546" width="132" height="194" fill="#1E4D3D" />
      <path d="M0 546H132A132 132 0 0 1 0 678Z" fill="#F5E4DA" />
    </svg>
  );
}

/**
 * Portada: panel de presentación (texto + composición geométrica) y los dos accesos, Bazar y Mobiliario,
 * con las figuras del isotipo. Los accesos eligen el grupo: debajo aparecen sus categorías (misma dinámica del catálogo).
 */
export function HomeHero({ group, onGroup, onAll, wa }: { group: CategoryGroup | "todo"; onGroup: (g: CategoryGroup | "todo") => void; onAll: () => void; wa: string }) {
  return (
    <section className="hh" aria-label="Presentación">
      <div className="hh-art">
        <HeroArt />
        <HeroColumn />
        <div className="hh-copy">
          <h1>Equipamiento profesional para la hospitalidad</h1>
          <p>Mobiliario, vajilla, cristalería y bazar para hoteles y restaurantes, con diseño, calidad y asesoramiento experto.</p>
          <div className="hh-cta">
            <button type="button" className="btn btn-terra btn-lg" onClick={onAll}>Ver catálogo completo<ArrowRight /></button>
            <WaLink href={wa} channel="quote" className="btn hh-quote btn-lg">Pedir cotización</WaLink>
          </div>
        </div>
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
