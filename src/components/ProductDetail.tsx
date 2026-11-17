"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Check, ChefHat, ChevronLeft, ChevronRight, Copy, Image as ImageIcon, Info, Layers, ListPlus, Maximize2, Sofa, Stamp, Sun, X } from "lucide-react";
import { mediaUrl } from "@/lib/env";

// El visor 3D (Three.js) se descarga solo cuando el usuario elige «Ver en 3D»
const Viewer3D = dynamic(() => import("./Viewer3D").then((m) => m.Viewer3D), { ssr: false, loading: () => <div className="v3d v3d-loading-box"><span className="v3d-spin" />Cargando visor 3D…</div> });
import { AVAILABILITY, TAGS, money, msgProduct, priceShown, waLink } from "@/lib/format";
import { FEATURE_LABEL, featuresOf, specsOf, type FeatureKey } from "@/lib/specs";
import { track } from "@/lib/track";
import type { Category, Product, Settings } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { QtyInput } from "./QtyInput";
import { useStore } from "./store/StoreProvider";
import { useFlash } from "./useFlash";
import { SHOW_3D } from "@/lib/features";
import { WaLink } from "./WaLink";

/** Ícono de mesa (lucide no tiene uno de mesa simple). */
const TableIcon = () => <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 9h18M5 9v10M19 9v10M8 9V6h8v3" /></svg>;

/* Íconos de línea propios para los aptos (mismo trazo que lucide) */
const svgP = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, className: "lucide" };
const MicrowaveIc = () => <svg {...svgP}><rect x="2.5" y="5" width="19" height="14" rx="2" /><rect x="5" y="7.5" width="10.5" height="9" rx="1.2" /><path d="M18.5 8.5v.01M18.5 11.5v.01M18.5 15h0" /></svg>;
const OvenIc = () => <svg {...svgP}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 8h18" /><rect x="6" y="11" width="12" height="7" rx="1" /><path d="M7 5.5h.01M10 5.5h.01M13 5.5h.01" /></svg>;
const DishwasherIc = () => <svg {...svgP}><rect x="3.5" y="3" width="17" height="18" rx="2" /><path d="M3.5 7.5h17M7 5.3h.01M10 5.3h.01" /><circle cx="9" cy="14.5" r="2.6" /><circle cx="15.5" cy="14.5" r="2.6" /></svg>;
const FEATURE_ICON: Record<FeatureKey, React.ReactNode> = {
  microondas: <MicrowaveIc />, horno: <OvenIc />, lavavajillas: <DishwasherIc />,
  apilable: <Layers />, exterior: <Sun />, tapizado: <Sofa />, personalizable: <Stamp />, profesional: <ChefHat />,
};

/** Primeras oraciones de la descripción (resumen comercial breve). */
function brief(d: string, max = 175): { short: string; cut: boolean } {
  const t = d.trim();
  if (t.length <= max) return { short: t, cut: false };
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [t];
  let out = "";
  for (const s of sentences) { if ((out + s).length > max && out) break; out += s; }
  return { short: out.trim() || t.slice(0, max).trim() + "…", cut: out.trim().length < t.length };
}

export function ProductDetail({ p, category, group, subtype, settings, base }: {
  p: Product; category?: Category; group: "bazar" | "mobiliario" | null; subtype?: { label: string; href: string } | null; settings: Settings; base: string;
}) {
  const { list, addToList, toast } = useStore();
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [media, setMedia] = useState<"foto" | "3d" | "mesa">("foto");
  // Visor 3D y «Ver en mesa» desactivados provisoriamente (ver src/lib/features.ts)
  const model = SHOW_3D ? mediaUrl(p.model_url) : null;
  const [variant, setVariant] = useState(p.variants[0] ?? "");
  const [qty, setQty] = useState(1);
  const inList = list.find((i) => i.sku === p.sku && i.variant === variant);
  const [added, flashAdded] = useFlash(1800);
  const [copied, flashCopied] = useFlash(1500);
  const views = p.images.map((_, i) => i);
  const showPrice = priceShown(p, settings);
  const wa = waLink(settings.whatsapp, msgProduct(base, p, variant, qty));
  const features = featuresOf(p, group);
  const specs = specsOf(p, category?.slug);
  const desc = brief(p.description || "");

  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  useEffect(() => { track("product_view", { product_id: p.id }); }, [p.id]);
  // En el celular, si el botón principal sale de pantalla, aparece una barra fija con la consulta
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { rootMargin: "0px 0px -60px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Foto ampliada: Esc cierra, flechas cambian de foto
  const step = useCallback((d: number) => setImg((i) => (i + d + views.length) % Math.max(1, views.length)), [views.length]);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [zoom, step]);

  const copySku = async () => {
    try { await navigator.clipboard.writeText(p.sku); flashCopied(); } catch { /* sin portapapeles */ }
  };
  const add = () => {
    addToList(p.sku, variant, qty);
    flashAdded();
    toast(`${qty > 1 ? `${qty} unidades agregadas` : "Agregado"} a tu lista`, ["Ver lista", "/lista"]);
  };

  // Ficha técnica completa (debajo): datos relevantes para el comprador
  const sheet: [string, React.ReactNode][] = [
    ["Código", <span className="mono" key="s">{p.sku}</span>],
    ...(category ? [["Categoría", <Link key="c" href={`/categoria/${category.slug}`}>{category.name}</Link>] as [string, React.ReactNode]] : []),
    ...(subtype ? [["Tipo", <Link key="t" href={subtype.href}>{subtype.label}</Link>] as [string, React.ReactNode]] : []),
    ...specs.map((s) => [s.label, s.value] as [string, React.ReactNode]),
    ...(p.variants.length > 1 ? [["Variantes", p.variants.join(" · ")] as [string, React.ReactNode]] : []),
    ...(features.length ? [["Características", features.map((f) => FEATURE_LABEL[f]).join(" · ")] as [string, React.ReactNode]] : []),
  ];

  return (
    <>
      <div className="pdx">
        <div className={`pdx-gal ${views.length > 1 ? "multi" : ""}`}>
          {views.length > 1 && (
            <div className="pdx-thumbs" role="tablist" aria-label="Fotos del producto">
              {views.map((i) => (
                <button key={i} type="button" role="tab" aria-selected={img === i} aria-current={img === i} aria-label={`Foto ${i + 1}`} onClick={() => { setImg(i); setMedia("foto"); }}>
                  <ProductImage p={p} view={i} label={false} sizes="96px" />
                </button>
              ))}
            </div>
          )}
          <div className="pdx-main-col">
            <div className={`pdx-main ${media !== "foto" ? "is-3d" : ""}`}>
              {media !== "foto" && model ? (
                <Viewer3D url={model} name={p.name} mode={media === "mesa" ? "table" : "studio"} />
              ) : (
                <button type="button" className="pdx-zoom-area" onClick={() => p.images.length && setZoom(true)} aria-label="Ampliar foto" disabled={!p.images.length}>
                  <ProductImage key={img} p={p} view={img} sizes="(max-width: 860px) 100vw, 48vw" priority full />
                </button>
              )}
              {p.tag && media === "foto" && <span className={`pc-tag pc-tag-${p.tag}`}>{TAGS[p.tag]}</span>}
              {p.images.length > 0 && media === "foto" && (
                <button type="button" className="pdx-expand" onClick={() => setZoom(true)} aria-label="Ampliar foto" title="Ampliar"><Maximize2 /></button>
              )}
            </div>
            {model && (
              <div className="media-switch" role="tablist" aria-label="Tipo de vista">
                <button type="button" role="tab" aria-selected={media === "foto"} onClick={() => setMedia("foto")}><ImageIcon />Foto</button>
                <button type="button" role="tab" aria-selected={media === "3d"} onClick={() => setMedia("3d")}><Box />Ver en 3D</button>
                <button type="button" role="tab" aria-selected={media === "mesa"} onClick={() => setMedia("mesa")}><TableIcon />Ver en mesa</button>
              </div>
            )}
            {!p.images.length && <p className="notice"><Info />Imagen ilustrativa. Pedinos fotos reales por WhatsApp.</p>}
          </div>
        </div>

        <div className="pdx-info">
          {category && <Link className="pdx-cat" href={`/categoria/${category.slug}`}>{category.name}</Link>}
          <h1 className="pdx-title">{p.name}</h1>
          <div className="pdx-meta">
            <button type="button" className={`pdx-sku ${copied ? "ok" : ""}`} onClick={copySku} title="Copiar código" aria-label={`Código ${p.sku}. Copiar`}>
              <span>Código</span><b>{p.sku}</b>{copied ? <Check /> : <Copy />}
            </button>
            {copied ? <span className="pdx-copied" role="status">Copiado</span> : null}
            {p.availability !== "consultar" && (
              <span className={`avail ${p.availability === "sin_stock" ? "sin-stock" : p.availability}`}><i className="dot" />{AVAILABILITY[p.availability]}</span>
            )}
          </div>
          {showPrice && (
            <div className="price pdx-price">{money(p.price!)}{p.tag === "oferta" && p.old_price ? <s>{money(p.old_price)}</s> : null}</div>
          )}

          {desc.short && <p className="pdx-desc">{desc.short}{desc.cut && <> <a href="#ficha" className="pdx-more">Ver más</a></>}</p>}

          {features.length > 0 && (
            <ul className="pdx-feats" aria-label="Características principales">
              {features.map((f) => <li key={f}>{FEATURE_ICON[f]}<span>{FEATURE_LABEL[f]}</span></li>)}
            </ul>
          )}

          {specs.length > 0 && (
            <dl className="pdx-specs" style={{ ["--n" as string]: Math.min(specs.length, 4) }}>
              {specs.slice(0, 4).map((s) => <div key={s.label + s.value}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
            </dl>
          )}

          {p.variants.length > 0 && (
            <div className="pdx-var">
              <span className="opt-label">Variante: <span style={{ fontWeight: 500 }}>{variant}</span></span>
              <div className="variants">
                {p.variants.map((v) => <button key={v} aria-pressed={v === variant} onClick={() => setVariant(v)}>{v}</button>)}
              </div>
            </div>
          )}

          <section className="pdx-buy" aria-label="Consultar este producto">
            <QtyInput value={qty} onChange={setQty} name={p.name} size="lg" />
            <div ref={ctaRef} className="pdx-wa">
              <WaLink href={wa} channel="product" productId={p.id} className="btn btn-wa btn-lg btn-block">
                Consultar por WhatsApp
              </WaLink>
            </div>
            <button className={`btn pdx-add ${added ? "added" : ""}`} aria-live="polite" onClick={add}>
              <span className="pc-ic" key={added}>{added ? <Check /> : <ListPlus />}</span>
              {added ? "Agregado" : "Agregar a la lista"}
            </button>
          </section>
          <p className="pdx-hint">
            <Info />
            <span>
              {inList ? <><Link href="/lista">Ya está en tu lista ({inList.qty})</Link>. </> : null}
              Te respondemos por WhatsApp con precio y disponibilidad. No es una compra.
            </span>
          </p>
        </div>

        <div className={`pd-sticky ${ctaVisible ? "" : "show"}`} aria-hidden={ctaVisible}>
          <div className="pd-sticky-t"><b>{p.sku}</b><span>{qty} {qty === 1 ? "unidad" : "unidades"}</span></div>
          <WaLink href={wa} channel="product" productId={p.id} className="btn btn-wa">Consultar por WhatsApp</WaLink>
        </div>
      </div>

      <section className="pdx-sheet" id="ficha" aria-labelledby="h-ficha">
        <div className="pdx-tabs" role="presentation"><h2 id="h-ficha" className="on">Ficha técnica</h2></div>
        <div className="pdx-sheet-body">
          <dl className="pdx-table">
            {sheet.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {desc.cut && <div className="pdx-longdesc"><h3>Descripción</h3><p>{p.description}</p></div>}
        </div>
      </section>

      {zoom && createPortal(
        <div className="pdx-lb" role="dialog" aria-modal="true" aria-label={`Foto ampliada de ${p.name}`} onClick={() => setZoom(false)}>
          <button type="button" className="pdx-lb-x" aria-label="Cerrar" onClick={() => setZoom(false)} autoFocus><X /></button>
          {views.length > 1 && <button type="button" className="pdx-lb-nav l" aria-label="Foto anterior" onClick={(e) => { e.stopPropagation(); step(-1); }}><ChevronLeft /></button>}
          <div className="pdx-lb-img" onClick={(e) => e.stopPropagation()}>
            <ProductImage key={`z${img}`} p={p} view={img} sizes="100vw" full hiRes />
          </div>
          {views.length > 1 && <button type="button" className="pdx-lb-nav r" aria-label="Foto siguiente" onClick={(e) => { e.stopPropagation(); step(1); }}><ChevronRight /></button>}
          {views.length > 1 && <span className="pdx-lb-n">{img + 1} / {views.length}</span>}
        </div>,
        document.body
      )}
    </>
  );
}
