"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Search, X } from "lucide-react";
import { reviewNewProducts } from "@/app/admin/actions";
import { searchable } from "@/lib/format";
import { GROUPS, groupOf } from "@/lib/groups";
import type { Category, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

/** Revisión de nuevas incorporaciones: elegir categoría y dar el OK final para publicar. */
export function NewProductsReview({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [cats, setCats] = useState<Record<string, string>>(() => Object.fromEntries(products.map((p) => [p.id, p.category_id ?? ""])));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const real = categories.filter((c) => !c.is_offers);

  const rows = useMemo(() => {
    const w = searchable(q).split(" ").filter(Boolean);
    return products.filter((p) => (!catFilter || cats[p.id] === catFilter) && (!w.length || w.every((x) => searchable(`${p.name} ${p.sku}`).includes(x))));
  }, [products, q, catFilter, cats]);
  const allSel = rows.length > 0 && rows.every((p) => sel.has(p.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const run = (approve: string[], discard: string[]) => {
    if (!approve.length && !discard.length) return;
    setMsg(null);
    start(async () => {
      const r = await reviewNewProducts({ approve: approve.map((id) => ({ id, category_id: cats[id] })), discard });
      if (r.ok) {
        setSel(new Set());
        setMsg({ ok: true, text: approve.length ? `${approve.length} producto${approve.length === 1 ? "" : "s"} publicado${approve.length === 1 ? "" : "s"} en la tienda.` : `${discard.length} producto${discard.length === 1 ? "" : "s"} descartado${discard.length === 1 ? "" : "s"}.` });
        router.refresh();
      } else setMsg({ ok: false, text: r.error ?? "No se pudo completar." });
    });
  };
  const selected = [...sel].filter((id) => products.some((p) => p.id === id));

  return (
    <>
      <div className="adm-h">
        <div>
          <h2>Nuevas incorporaciones</h2>
          <p>{products.length} producto{products.length === 1 ? "" : "s"} del catálogo Mobiliario Clásico esperando tu OK. No se ven en la tienda hasta que los aprobás. Podés mejorar sus fotos desde <Link href="/admin/imagenes" style={{ textDecoration: "underline" }}>Imágenes</Link> (categoría “Nuevas incorporaciones”).</p>
        </div>
      </div>
      {msg && <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} role="status">{msg.text}</div>}
      {products.length === 0 ? (
        <div className="panel"><p className="hint">No hay nuevas incorporaciones pendientes.</p></div>
      ) : (
        <>
          <div className="np-bar">
            <div className="search" style={{ display: "flex", maxWidth: 320, flex: "1 1 220px" }}><Search aria-hidden /><input type="search" placeholder="Buscar por nombre o código" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" /></div>
            <select className="input" style={{ width: "auto", height: 42 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filtrar por categoría">
              <option value="">Todas las categorías</option>
              {real.filter((c) => products.some((p) => cats[p.id] === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="hint">{rows.length} en la vista · {selected.length} seleccionado{selected.length === 1 ? "" : "s"}</span>
            <span style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm" disabled={pending || !selected.length} onClick={() => run([], selected)}><X />Descartar selección</button>
            <button className="btn btn-dark btn-sm" disabled={pending || !selected.length} onClick={() => run(selected, [])}><Check />Aprobar selección</button>
            <button className="btn btn-dark btn-sm" disabled={pending || !rows.length} onClick={() => run(rows.map((p) => p.id), [])}><Check />Aprobar todos los de la vista</button>
          </div>
          <div className="tbl-wrap" aria-busy={pending}>
            <table className="tbl">
              <thead><tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(rows.map((p) => p.id)))} aria-label="Seleccionar todos" /></th>
                <th>Producto</th><th>Código</th><th>Categoría al publicar</th><th style={{ textAlign: "right" }}>Acción</th>
              </tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Seleccionar ${p.name}`} /></td>
                    <td><div className="pt"><span className="t"><ProductImage p={p} label={false} sizes="56px" /></span><span>{p.name}<small className="hint" style={{ display: "block" }}>{p.description.split(". ")[1] ?? ""}</small></span></div></td>
                    <td className="mono">{p.sku}</td>
                    <td>
                      <select className="input" style={{ height: 36, minWidth: 190 }} value={cats[p.id]} onChange={(e) => setCats((c) => ({ ...c, [p.id]: e.target.value }))} aria-label={`Categoría de ${p.name}`}>
                        {GROUPS.map((g) => (
                          <optgroup key={g.key} label={g.name}>
                            {real.filter((c) => groupOf(c) === g.key).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run([], [p.id])} title="Descartar (se archiva)"><X /></button>{" "}
                      <button className="btn btn-dark btn-sm" disabled={pending} onClick={() => run([p.id], [])}><Check />Aprobar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
