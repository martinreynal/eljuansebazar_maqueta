"use client";
import { useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { CategoryGroup } from "@/lib/types";
import { GroupShape } from "./GroupShape";

const BANNERS: { key: CategoryGroup; name: string; line: string; img: string; pos: string; tone: "forest" | "terra" }[] = [
  { key: "bazar", name: "Bazar", line: "Vajilla, cristalería y equipamiento profesional", img: "/catalogo-grupos/bazar.jpg", pos: "45% 60%", tone: "forest" },
  { key: "mobiliario", name: "Mobiliario", line: "Muebles para restaurantes, hoteles y más", img: "/catalogo-grupos/mobiliario.jpg", pos: "50% 55%", tone: "terra" },
];

/** Póster de la marca: mosaico geométrico (verde bosque y terracota sobre crema). Llena el panel, recortando parejo los bordes. */
function HeroPoster() {
  return (
    <img
      className="hh-poster"
      src="/catalogo-grupos/poster.webp"
      srcSet="/catalogo-grupos/poster-1000.webp 1000w, /catalogo-grupos/poster.webp 2000w"
      sizes="(max-width: 1000px) 100vw, 50vw"
      alt=""
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
  );
}

/**
 * Portada: panel de presentación (texto + composición geométrica) y los dos accesos, Bazar y Mobiliario,
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
    <div className="hh-screen">
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
    </div>
  );
}
