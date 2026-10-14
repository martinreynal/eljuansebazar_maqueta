"use client";
import Link from "next/link";
import { Check, ClipboardCheck, Heart, ListPlus } from "lucide-react";
import { AVAILABILITY, TAGS, money, msgProduct, priceShown, waLink } from "@/lib/format";
import type { Category, Product, Settings } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";
import { useFlash } from "./useFlash";

export type CardCtx = { settings: Settings; base: string; categories: Category[] };

export function ProductCard({ p, ctx, priority = false }: { p: Product; ctx: CardCtx; priority?: boolean }) {
  const { favs, list, toggleFav, addToList, toast } = useStore();
  const fav = favs.includes(p.sku);
  const inList = list.find((i) => i.sku === p.sku);
  const [added, flashAdded] = useFlash();
  const [pop, flashPop] = useFlash(500);
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
        className={`pc-fav ${fav ? "on" : ""} ${pop ? "pop" : ""}`}
        aria-pressed={fav}
        aria-label={`${fav ? "Quitar de" : "Agregar a"} favoritos`}
        onClick={() => {
          const on = toggleFav(p.sku);
          if (on) flashPop();
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
          className={`pc-btn pc-btn-icon ${inList ? "in" : ""} ${added ? "added" : ""}`}
          aria-label={inList ? `${p.name} está en tu lista (${inList.qty}). Sumar una unidad` : `Agregar ${p.name} a la lista de consulta`}
          title={inList ? `En tu lista (${inList.qty}) · sumar una unidad` : "Agregar a la lista de consulta"}
          onClick={() => {
            addToList(p.sku, p.variants[0] ?? "", 1);
            flashAdded();
            toast(inList ? `Sumaste una unidad (${inList.qty + 1} en total)` : `${p.sku} agregado a tu lista`, ["Ver lista", "/lista"]);
          }}
        >
          <span className="pc-ic" key={added}>{added ? <Check /> : inList ? <ClipboardCheck /> : <ListPlus />}</span>
        </button>
      </div>
    </article>
  );
}

export function ProductGrid({ products, ctx, priorityFirst = 0, rail = false }: { products: Product[]; ctx: CardCtx; priorityFirst?: number; rail?: boolean }) {
  return (
    <div className={rail ? "grid rail" : "grid"}>
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} ctx={ctx} priority={i < priorityFirst} />
      ))}
    </div>
  );
}
