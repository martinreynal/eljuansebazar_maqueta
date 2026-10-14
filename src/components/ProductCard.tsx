"use client";
import Link from "next/link";
import { Heart, ListPlus } from "lucide-react";
import { AVAILABILITY, TAGS, money, msgProduct, priceShown, waLink } from "@/lib/format";
import type { Category, Product, Settings } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";

export type CardCtx = { settings: Settings; base: string; categories: Category[] };

export function ProductCard({ p, ctx, priority = false }: { p: Product; ctx: CardCtx; priority?: boolean }) {
  const { favs, toggleFav, addToList, toast } = useStore();
  const fav = favs.includes(p.sku);
  const cat = ctx.categories.find((c) => c.id === p.category_id);
  const href = `/producto/${p.slug}`;
  const consult = waLink(ctx.settings.whatsapp, msgProduct(ctx.base, p));
  return (
    <article className="pc">
      <Link className="pc-media" href={href} aria-label={`Ver ${p.name}`} tabIndex={-1}>
        <ProductImage p={p} priority={priority} label={false} />
      </Link>
      {p.tag && <span className={`pc-tag pc-tag-${p.tag}`}>{TAGS[p.tag]}</span>}
      <button
        className={`pc-fav ${fav ? "on" : ""}`}
        aria-pressed={fav}
        aria-label={`${fav ? "Quitar de" : "Agregar a"} favoritos`}
        onClick={() => {
          const on = toggleFav(p.sku);
          toast(on ? "Guardado en favoritos" : "Quitado de favoritos", on ? ["Ver favoritos", "/favoritos"] : undefined);
        }}
      >
        <Heart />
      </button>
      <div className="pc-body">
        <div className="pc-meta">
          <span className="pc-sku">{p.sku}</span>
          {cat && <span className="pc-cat">{cat.name}</span>}
        </div>
        <h3 className="pc-name">
          <Link href={href}>{p.name}</Link>
        </h3>
        {priceShown(p, ctx.settings) && (
          <div className="pc-price">
            {money(p.price!)}
            {p.tag === "oferta" && p.old_price ? <s>{money(p.old_price)}</s> : null}
          </div>
        )}
        {p.availability === "sin_stock" && <span className="pc-stock">{AVAILABILITY[p.availability]}</span>}
      </div>
      <div className="pc-actions">
        <WaLink href={consult} channel="product" productId={p.id} className="pc-btn pc-btn-wa" label={`Pedir cotización de ${p.name} por WhatsApp`}>
          <span>Consultar</span>
        </WaLink>
        <button
          className="pc-btn pc-btn-icon"
          aria-label={`Agregar ${p.name} a la lista de consulta`}
          title="Agregar a la lista de consulta"
          onClick={() => {
            addToList(p.sku, p.variants[0] ?? "", 1);
            toast(`${p.name} agregado a tu lista`, ["Ver lista", "/lista"]);
          }}
        >
          <ListPlus />
        </button>
      </div>
    </article>
  );
}

export function ProductGrid({ products, ctx, priorityFirst = 0 }: { products: Product[]; ctx: CardCtx; priorityFirst?: number }) {
  return (
    <div className="grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} ctx={ctx} priority={i < priorityFirst} />
      ))}
    </div>
  );
}
