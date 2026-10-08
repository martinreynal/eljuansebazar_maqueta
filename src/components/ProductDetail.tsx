"use client";
import { useEffect, useState } from "react";
import { Clock, Heart, Info, ListPlus, MessageCircle, Minus, Plus, Truck } from "lucide-react";
import { AVAILABILITY, TAGS, money, msgProduct, priceShown, waLink } from "@/lib/format";
import { track } from "@/lib/track";
import type { Category, Product, Settings } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";

export function ProductDetail({ p, category, settings, base }: { p: Product; category?: Category; settings: Settings; base: string }) {
  const { favs, toggleFav, addToList, toast } = useStore();
  const [img, setImg] = useState(0);
  const [variant, setVariant] = useState(p.variants[0] ?? "");
  const [qty, setQty] = useState(1);
  const fav = favs.includes(p.sku);
  const views = p.images.length ? p.images.map((_, i) => i) : [0, 1, 2];

  useEffect(() => { track("product_view", { product_id: p.id }); }, [p.id]);

  return (
    <div className="pdp">
      <div className="gallery">
        <div className="thumbs" role="tablist" aria-label="Imágenes del producto">
          {views.length > 1 && views.map((i) => (
            <button key={i} role="tab" aria-current={img === i} aria-label={`Imagen ${i + 1}`} onClick={() => setImg(i)}>
              <ProductImage p={p} view={i} label={false} sizes="72px" />
            </button>
          ))}
        </div>
        <div className="main-img"><ProductImage key={img} p={p} view={img} sizes="(max-width: 860px) 100vw, 55vw" priority /></div>
      </div>

      <div className="pinfo">
        <div className="meta">
          {category && <span>{category.name}</span>}
          <span className="mono">SKU {p.sku}</span>
          {p.tag && <span className="pill" style={p.tag === "oferta" ? { color: "var(--promo)" } : undefined}>{TAGS[p.tag]}</span>}
        </div>
        <h1>{p.name}</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {priceShown(p, settings) ? (
            <div className="price">{money(p.price!)}{p.tag === "oferta" && p.old_price ? <s>{money(p.old_price)}</s> : null}</div>
          ) : (
            <div className="price ask">Precio a cotizar según cantidad y personalización</div>
          )}
          <span className={`avail ${p.availability === "sin_stock" ? "sin-stock" : p.availability}`}><i className="dot" />{AVAILABILITY[p.availability]}</span>
        </div>
        {p.description && <p className="desc">{p.description}</p>}
        {p.variants.length > 0 && (
          <div>
            <span className="opt-label">Color o variante: <span style={{ fontWeight: 500 }}>{variant}</span></span>
            <div className="variants">
              {p.variants.map((v) => <button key={v} aria-pressed={v === variant} onClick={() => setVariant(v)}>{v}</button>)}
            </div>
          </div>
        )}
        <div className="cta-stack">
          <WaLink href={waLink(settings.whatsapp, msgProduct(base, p, variant))} channel="product" productId={p.id} className="btn btn-wa btn-lg">Pedir cotización por WhatsApp</WaLink>
          <div className="buy-row">
            <div className="stepper" aria-label="Cantidad">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar uno"><Minus /></button>
              <output aria-live="polite">{qty}</output>
              <button onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Sumar uno"><Plus /></button>
            </div>
            <div className="cta-row">
              <button className="btn btn-ghost" onClick={() => { addToList(p.sku, variant, qty); toast(`${p.name} agregado a tu lista`, ["Ver lista", "/lista"]); }}><ListPlus />Agregar a la lista de consulta</button>
              <button className={`btn btn-ghost sq fav-inline ${fav ? "on" : ""}`} style={{ width: 44 }} aria-pressed={fav} aria-label={`${fav ? "Quitar de" : "Agregar a"} favoritos`} onClick={() => { const on = toggleFav(p.sku); toast(on ? "Guardado en favoritos" : "Quitado de favoritos"); }}><Heart /></button>
            </div>
          </div>
        </div>
        <dl className="specs">
          {p.materials && <div><dt>Materiales</dt><dd>{p.materials}</dd></div>}
          {p.dimensions && <div><dt>Dimensiones</dt><dd>{p.dimensions}</dd></div>}
          {p.variants.length > 0 && <div><dt>Variantes</dt><dd>{p.variants.join(" · ")}</dd></div>}
          <div><dt>Disponibilidad</dt><dd>{AVAILABILITY[p.availability]}</dd></div>
          <div><dt>Código</dt><dd className="mono">{p.sku}</dd></div>
        </dl>
        <div className="assure">
          <div><MessageCircle /><b>Cotización por WhatsApp</b>Te pasamos precio según cantidad.</div>
          <div><Clock /><b>Horario de atención</b>{settings.hours.split("·")[0].trim() || "Consultanos"}</div>
          <div><Truck /><b>Envíos</b>A todo el país, según tu zona.</div>
        </div>
        {!p.images.length && <p className="notice"><Info />Imagen ilustrativa. Pedinos fotos reales por WhatsApp.</p>}
      </div>
    </div>
  );
}
