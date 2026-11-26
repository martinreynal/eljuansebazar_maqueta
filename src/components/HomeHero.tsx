"use client";
import { useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { CategoryGroup } from "@/lib/types";
import { GroupShape } from "./GroupShape";

const BANNERS: { key: CategoryGroup; name: string; line: string; img: string; pos: string; tone: "forest" | "terra" }[] = [
  { key: "bazar", name: "Bazar", line: "Vajilla, cristalería y equipamiento profesional", img: "/catalogo-grupos/bazar.jpg", pos: "45% 60%", tone: "forest" },
  { key: "mobiliario", name: "Mobiliario", line: "Muebles para restaurantes, hoteles y más", img: "/catalogo-grupos/mobiliario.jpg", pos: "50% 55%", tone: "terra" },
];

/**
 * Portada: presentación centrada (antetítulo, título y bajada) y los dos accesos, Bazar y Mobiliario, a todo el ancho,
 * con las figuras del isotipo. Los accesos eligen el grupo: debajo aparecen sus categorías (misma dinámica del catálogo).
 */
export function HomeHero({ group, onGroup }: { group: CategoryGroup | "todo"; onGroup: (g: CategoryGroup | "todo") => void }) {
  // Altura real del encabezado (y de cualquier aviso arriba de él) para que la portada ocupe justo la primera pantalla
  useEffect(() => {
    const set = () => {
      const h = document.querySelector<HTMLElement>(".hdr");
      if (h) document.documentElement.style.setProperty("--hdr-h", `${Math.round(h.offsetHeight + ((h.previousElementSibling as HTMLElement | null)?.offsetHeight ?? 0))}px`);
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  return (
    <div className="hh-screen hv">
      <header className="hv-intro">
        <p className="hv-eyebrow">Soluciones para hospitalidad</p>
        <h1>Bazar y Mobiliario Profesional</h1>
        <p className="hv-lead">Abastecimiento integral de productos para empresas, establecimientos y proyectos de cualquier escala.</p>
      </header>
      <div className={`hv-banners ch-banners${group !== "todo" ? " picked" : ""}`} role="tablist" aria-label="Grupos del catálogo">
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
    </div>
  );
}
