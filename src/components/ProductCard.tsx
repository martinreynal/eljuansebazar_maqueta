"use client";
import Link from "next/link";
import { Heart, ListPlus } from "lucide-react";
import { AVAILABILITY, TAGS, money, msgProduct, priceShown, shortDesc, waLink } from "@/lib/format";
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
  return (
    <article className="card">
      <Link className="card-media" href={href} aria-label={`Ver ${p.name}`}>
        <ProductImage p={p} priority={priority} />
        {p.tag && <span className={`tag tag-${p.tag}`}>{TAGS[p.tag]}</span>}
      </Link>
      <button
        className={`fav-btn ${fav ? "on" : ""}`}
        aria-pressed={fav}
        aria-label={`${fav ? "Quitar de" : "Agregar a"} favoritos`}
        onClick={() => {
          const on = toggleFav(p.sku);
          toast(on ? "Guardado en favoritos" : "Quitado de favoritos", on ? ["Ver favoritos", "/favoritos"] : undefined);
        }}
      >
        <Heart />
      </button>
      <div className="card-body">
        <span className="card-cat">
          <span className="mono card-sku">{p.sku}</span>
          {cat ? ` · ${cat.name}` : ""}
        </span>
        <h3>
          <Link href={href}>{p.name}</Link>
        </h3>
        <p className="card-desc">{shortDesc(p)}</p>
        {priceShown(p, ctx.settings) && (
          <div className="price">
            {money(p.price!)}
            {p.tag === "oferta" && p.old_price ? <s>{money(p.old_price)}</s> : null}
          </div>
        )}
        {p.availability !== "disponible" && (
          <span className={`avail ${p.availability === "sin_stock" ? "sin-stock" : p.availability}`}>
            <i className="dot" />
            {AVAILABILITY[p.availability]}
          </span>
        )}
      </div>
      <div className="card-actions">
        <Link className="btn btn-ghost view" href={href}>
          Ver producto
        </Link>
        <WaLink
          href={waLink(ctx.settings.whatsapp, msgProduct(ctx.base, p))}
          channel="product"
          productId={p.id}
          className="btn wa-soft sq"
          label={`Pedir cotización de ${p.name} por WhatsApp`}
        />
        <button
          className="btn btn-soft sq"
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
