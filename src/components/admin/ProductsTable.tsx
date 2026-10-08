"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Search, Star } from "lucide-react";
import { updateProductFlags } from "@/app/admin/actions";
import { AVAILABILITY, TAGS, money, searchable } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

export function availPill(a: Product["availability"]) {
  const cls = a === "disponible" ? "ok" : a === "consultar" ? "warn" : a === "sin_stock" ? "bad" : "off";
  return <span className={`pill ${cls}`}>{AVAILABILITY[a]}</span>;
}

export function ProductsTable({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"activos" | "archivados">("activos");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cat = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "Sin categoría";

  const rows = useMemo(() => {
    const w = searchable(q).split(" ").filter(Boolean);
    return products
      .filter((p) => (show === "archivados" ? p.archived : !p.archived))
      .filter((p) => !w.length || w.every((x) => searchable(`${p.name} ${p.sku}`).includes(x)));
  }, [products, q, show]);

  const flag = (p: Product, patch: Parameters<typeof updateProductFlags>[1], ok: string) =>
    start(async () => {
      const r = await updateProductFlags(p.id, patch);
      setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error });
      router.refresh();
    });

  const visibleCount = products.filter((p) => p.visible && !p.archived && p.availability !== "discontinuado").length;
  return (
    <>
      <div className="adm-h">
        <div><h2>Productos</h2><p>{products.filter((p) => !p.archived).length} productos · {visibleCount} publicados en la tienda</p></div>
        <Link className="btn btn-dark" href="/admin/productos/nuevo"><Plus />Nuevo producto</Link>
      </div>
      {msg && <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} role="status">{msg.text}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <div className="search" style={{ display: "flex", maxWidth: 380, flex: "1 1 240px" }}><Search aria-hidden /><input type="search" placeholder="Buscar por nombre o SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar productos" /></div>
        <div className="seg" role="group" aria-label="Mostrar">
          <button aria-pressed={show === "activos"} onClick={() => setShow("activos")}>Activos</button>
          <button aria-pressed={show === "archivados"} onClick={() => setShow("archivados")}>Archivados ({products.filter((p) => p.archived).length})</button>
        </div>
      </div>
      <div className="tbl-wrap" aria-busy={pending}>
        <table className="tbl">
          <thead><tr><th>Producto</th><th>SKU</th><th>Categoría</th><th className="num">Precio</th><th>Estado</th><th>Destacado</th><th>Visible</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={p.visible ? "" : "muted"}>
                <td><div className="pt"><span className="t"><ProductImage p={p} view={1} label={false} sizes="42px" /></span><span>{p.name}{p.tag && <> <span className="pill">{TAGS[p.tag]}</span></>}</span></div></td>
                <td className="mono">{p.sku}</td>
                <td>{cat(p.category_id)}</td>
                <td className="num">{p.price != null ? money(p.price) : "—"}</td>
                <td>{availPill(p.availability)}</td>
                <td>
                  <button className="icon-btn" aria-pressed={p.featured} aria-label={`${p.featured ? "Quitar de" : "Marcar como"} destacado`} onClick={() => flag(p, { featured: !p.featured }, p.featured ? "Quitado de destacados." : "Marcado como destacado.")}>
                    <Star style={p.featured ? { fill: "var(--warn)", stroke: "var(--warn)" } : undefined} />
                  </button>
                </td>
                <td>
                  <label className="switch"><input type="checkbox" checked={p.visible} aria-label={`Visible en la tienda: ${p.name}`} onChange={(e) => flag(p, { visible: e.target.checked }, e.target.checked ? "Producto visible en la tienda." : "Producto oculto de la tienda.")} /><span /></label>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Link className="btn btn-ghost btn-sm" href={`/admin/productos/${p.id}`}><Pencil />Editar</Link>
                  {show === "archivados" && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }} onClick={() => flag(p, { archived: false }, "Producto desarchivado.")}>Desarchivar</button>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>{q ? "No hay productos que coincidan con la búsqueda." : show === "archivados" ? "No hay productos archivados." : "Todavía no cargaste productos."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
