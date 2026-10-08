"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Category, Product, Settings } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { useStore } from "./store/StoreProvider";

export function FavsClient({ products, categories, settings, base }: { products: Product[]; categories: Category[]; settings: Settings; base: string }) {
  const { favs, ready } = useStore();
  if (!ready) return <div className="sk" style={{ height: 240 }} aria-busy="true" />;
  const list = favs.map((s) => products.find((p) => p.sku === s)).filter((p): p is Product => Boolean(p));
  if (!list.length)
    return (
      <div className="empty">
        <div className="ic"><Heart /></div>
        <h3>Todavía no guardaste favoritos</h3>
        <p>Tocá el corazón en cualquier producto para tenerlo a mano y consultarlo después.</p>
        <Link className="btn btn-dark" href="/catalogo">Ver productos</Link>
      </div>
    );
  return (
    <>
      <p className="hint" style={{ marginBottom: 18 }}>{list.length} producto{list.length === 1 ? "" : "s"} guardado{list.length === 1 ? "" : "s"} en este navegador.</p>
      <ProductGrid products={list} ctx={{ settings, base, categories }} />
    </>
  );
}
