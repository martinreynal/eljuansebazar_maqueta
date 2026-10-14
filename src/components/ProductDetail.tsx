"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Heart, Info, ListPlus } from "lucide-react";
import { AVAILABILITY, TAGS, money, msgProduct, priceShown, waLink } from "@/lib/format";
import { track } from "@/lib/track";
import type { Category, Product, Settings } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { QtyInput } from "./QtyInput";
import { useStore } from "./store/StoreProvider";
import { useFlash } from "./useFlash";
import { WaLink } from "./WaLink";

export function ProductDetail({ p, category, settings, base }: { p: Product; category?: Category; settings: Settings; base: string }) {
  const { favs, list, toggleFav, addToList, toast } = useStore();
  const [img, setImg] = useState(0);
  const [variant, setVariant] = useState(p.variants[0] ?? "");
  const [qty, setQty] = useState(1);
  const fav = favs.includes(p.sku);
  const inList = list.find((i) => i.sku === p.sku && i.variant === variant);
  const [added, flashAdded] = useFlash(1800);
  const [pop, flashPop] = useFlash(500);
  const [copied, flashCopied] = useFlash(1500);
  const views = p.images.map((_, i) => i);
  const showPrice = priceShown(p, settings);
  const wa = waLink(settings.whatsapp, msgProduct(base, p, variant, qty));

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

  const copySku = async () => {
    try { await navigator.clipboard.writeText(p.sku); flashCopied(); } catch { /* sin portapapeles */ }
  };
  const add = () => {
    addToList(p.sku, variant, qty);
    flashAdded();
    toast(`${qty > 1 ? `${qty} unidades agregadas` : "Agregado"} a tu lista`, ["Ver lista", "/lista"]);
  };
  const toggle = () => {
    const on = toggleFav(p.sku);
    if (on) flashPop();
    toast(on ? "Guardado en favoritos" : "Quitado de favoritos");
  };

  const specs: [string, React.ReactNode][] = [
    ["Código", <span className="mono" key="s">{p.sku}</span>],
    ...(category ? [["Categoría", <Link key="c" href={`/categoria/${category.slug}`}>{category.name}</Link>] as [string, React.ReactNode]] : []),
    ...(p.materials ? [["Material", p.materials] as [string, React.ReactNode]] : []),
    ...(p.dimensions ? [["Medidas", p.dimensions] as [string, React.ReactNode]] : []),
    ...(p.variants.length > 1 ? [["Variantes", p.variants.join(" · ")] as [string, React.ReactNode]] : []),
  ];

  return (
    <div className="pdp">
      <div className={`gallery ${views.length > 1 ? "multi" : ""}`}>
        <div className="main-img">
          <ProductImage key={img} p={p} view={img} sizes="(max-width: 860px) 100vw, 55vw" priority full />
          {p.tag && <span className={`pc-tag pc-tag-${p.tag}`}>{TAGS[p.tag]}</span>}
        </div>
        {views.length > 1 && (
          <div className="thumbs" role="tablist" aria-label="Fotos del producto">
            {views.map((i) => (
              <button key={i} role="tab" aria-selected={img === i} aria-current={img === i} aria-label={`Foto ${i + 1}`} onClick={() => setImg(i)}>
                <ProductImage p={p} view={i} label={false} sizes="80px" />
              </button>
            ))}
          </div>
        )}
        {!p.images.length && <p className="notice"><Info />Imagen ilustrativa. Pedinos fotos reales por WhatsApp.</p>}
      </div>

      <div className="pinfo">
        <header className="pi-head">
          <div className="pi-meta">
            {category && <Link className="pi-cat" href={`/categoria/${category.slug}`}>{category.name}</Link>}
            <button type="button" className={`pi-sku ${copied ? "ok" : ""}`} onClick={copySku} title="Copiar código" aria-label={`Código ${p.sku}. Copiar`}>
              <span>Código</span><b>{p.sku}</b>{copied ? <Check /> : <Copy />}
            </button>
          </div>
          <h1>{p.name}</h1>
          {showPrice ? (
            <div className="price">{money(p.price!)}{p.tag === "oferta" && p.old_price ? <s>{money(p.old_price)}</s> : null}</div>
          ) : (
            <p className="pi-ask">Precio y disponibilidad a consultar</p>
          )}
          {p.availability !== "consultar" && (
            <span className={`avail ${p.availability === "sin_stock" ? "sin-stock" : p.availability}`}><i className="dot" />{AVAILABILITY[p.availability]}</span>
          )}
        </header>

        {p.description && <p className="pi-desc">{p.description}</p>}

        <section className="buybox" aria-label="Consultar este producto">
          {p.variants.length > 0 && (
            <div>
              <span className="opt-label">Variante: <span style={{ fontWeight: 500 }}>{variant}</span></span>
              <div className="variants">
                {p.variants.map((v) => <button key={v} aria-pressed={v === variant} onClick={() => setVariant(v)}>{v}</button>)}
              </div>
            </div>
          )}
          <div className="bb-qty">
            <span className="opt-label" id="qty-l">Cantidad</span>
            <QtyInput value={qty} onChange={setQty} name={p.name} size="lg" />
          </div>
          <div ref={ctaRef}>
            <WaLink href={wa} channel="product" productId={p.id} className="btn btn-wa btn-lg btn-block bb-wa">
              Consultar por WhatsApp
            </WaLink>
          </div>
          <div className="bb-row">
            <button className={`btn btn-ghost add-btn ${added ? "added" : ""}`} aria-live="polite" onClick={add}>
              <span className="pc-ic" key={added}>{added ? <Check /> : <ListPlus />}</span>
              {added ? "Agregado a tu lista" : "Agregar a la lista"}
            </button>
            <button className={`btn btn-ghost sq fav-inline ${fav ? "on" : ""} ${pop ? "pop" : ""}`} aria-pressed={fav} aria-label={`${fav ? "Quitar de" : "Agregar a"} favoritos`} title="Favoritos" onClick={toggle}><Heart /></button>
          </div>
          <p className="bb-hint">
            {inList ? <><Link href="/lista">Ya está en tu lista ({inList.qty})</Link>. </> : null}
            Te respondemos por WhatsApp con precio y disponibilidad. No es una compra.
          </p>
        </section>

        <dl className="pi-specs">
          {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </div>

      <div className={`pd-sticky ${ctaVisible ? "" : "show"}`} aria-hidden={ctaVisible}>
        <div className="pd-sticky-t"><b>{p.sku}</b><span>{qty} {qty === 1 ? "unidad" : "unidades"}</span></div>
        <WaLink href={wa} channel="product" productId={p.id} className="btn btn-wa">Consultar por WhatsApp</WaLink>
      </div>
    </div>
  );
}
