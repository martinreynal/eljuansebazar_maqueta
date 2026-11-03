"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BRAND_LOGOS } from "./BrandLogos";

export type MockStyle = { x: number; y: number; w: number; rot: number; tone: "dark" | "burnt" | "white" | "steel" };

/** Foto de la pieza con el logo "aplicado": SAGGIO por defecto y otra marca distinta en cada pasada del mouse. */
export function BrandMock({ img, alt, mock, offset }: { img: string; alt: string; mock: MockStyle; offset: number }) {
  const total = BRAND_LOGOS.length - 1; // 15 marcas de ejemplo (sin contar SAGGIO)
  const [idx, setIdx] = useState(0);
  const next = useRef(offset % total);
  const wrap = useRef<HTMLSpanElement>(null);

  const show = () => { setIdx(1 + next.current); next.current = (next.current + 1) % total; };
  // En pantallas táctiles (sin hover) las marcas van rotando solas
  useEffect(() => {
    if (!window.matchMedia?.("(hover: none)").matches) return;
    const card = wrap.current;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !t) t = setInterval(() => { next.current = (next.current + 1) % total; setIdx(1 + next.current); }, 2400);
      if (!e.isIntersecting && t) { clearInterval(t); t = undefined; }
    });
    if (card) io.observe(card);
    return () => { io.disconnect(); if (t) clearInterval(t); };
  }, [total]);
  useEffect(() => {
    const card = wrap.current?.closest(".bs-card");
    if (!card) return;
    const on = () => show(), off = () => setIdx(0);
    card.addEventListener("mouseenter", on); card.addEventListener("mouseleave", off);
    return () => { card.removeEventListener("mouseenter", on); card.removeEventListener("mouseleave", off); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { Logo, name } = BRAND_LOGOS[idx];
  return (
    <span className="bs-img" ref={wrap}>
      <Image src={img} alt={alt} fill sizes="(max-width: 860px) 50vw, 24vw" />
      <span className={`bs-logo tone-${mock.tone}`} style={{ left: `${mock.x}%`, top: `${mock.y}%`, width: `${mock.w}%`, transform: `translate(-50%,-50%) rotate(${mock.rot}deg)` }} aria-label={`Logo de ejemplo: ${name}`} role="img">
        <span key={idx} className="bs-logo-in"><Logo /></span>
      </span>
    </span>
  );
}
