"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

/** side: lado del texto (el producto queda del otro lado). fx: encuadre horizontal en celular (0–100). */
export type Slide = { eyebrow: string; title: string; line: string; href: string; img: string; imgMobile?: string; alt: string; side?: "left" | "right"; fx?: number; catHref?: string; catLabel?: string };

/** Carrusel de productos destacados: uno por vez, sin flechas (puntos, deslizar y avance automático). */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const n = slides.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setTimeout(() => go(i + 1), 6500);
    return () => clearTimeout(t);
  }, [i, n, paused, go]);

  if (!n) return null;
  return (
    <section
      className="hc"
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      {slides.map((s, k) => (
        <div key={s.href + k} className={`hc-slide ${s.side ?? "right"} ${k === i ? "on" : ""}`} style={{ ["--fx" as string]: `${s.fx ?? 50}%` }} role="group" aria-roledescription="diapositiva" aria-label={`${k + 1} de ${n}`} aria-hidden={k !== i}>
          <picture>
            {s.imgMobile && <source media="(max-width: 860px)" srcSet={s.imgMobile} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.img} alt={s.alt} loading={k === 0 ? "eager" : "lazy"} fetchPriority={k === 0 ? "high" : "auto"} decoding="async" />
          </picture>
          <div className="hc-txt">
            <span className="hc-eyebrow">{s.eyebrow}</span>
            <i aria-hidden />
            <h2>{s.title}</h2>
            <p>{s.line}</p>
            <div className="hc-ctas">
              <Link className="hc-cta hc-cta-main" href={s.href} tabIndex={k === i ? 0 : -1}>Ver producto <ArrowRight /></Link>
              {s.catHref && s.catLabel && <Link className="hc-cta" href={s.catHref} tabIndex={k === i ? 0 : -1}>{s.catLabel}</Link>}
            </div>
          </div>
        </div>
      ))}
      {n > 1 && (
        <div className="hc-dots" role="tablist" aria-label="Elegir producto destacado">
          {slides.map((s, k) => (
            <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={s.title} className={k === i ? "on" : ""} onClick={() => go(k)} />
          ))}
        </div>
      )}
    </section>
  );
}
