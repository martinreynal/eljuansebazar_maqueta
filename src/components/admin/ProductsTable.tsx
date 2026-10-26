"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { deleteProduct, updateProductFlags } from "@/app/admin/actions";
import { AVAILABILITY, TAGS, money, searchable } from "@/lib/format";
import { GROUPS, groupOf } from "@/lib/groups";
import type { Category, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

export function availPill(a: Product["availability"]) {
  const cls = a === "disponible" ? "ok" : a === "consultar" ? "warn" : a === "sin_stock" ? "bad" : "off";
  return <span className={`pill ${cls}`}>{AVAILABILITY[a]}</span>;
}

/** Etiqueta de categoría: al tocarla se abre la lista de categorías existentes para cambiarla. */
function CategoryPicker({ p, categories, onPick, disabled }: { p: Product; categories: Category[]; onPick: (id: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = categories.find((c) => c.id === p.category_id);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const list = categories.filter((c) => !c.is_offers);
  return (
    <div className="catpick" ref={ref}>
      <button type="button" className={`catpick-chip ${current ? "" : "none"}`} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((o) => !o)} title="Cambiar categoría">
        <span>{current?.name ?? "Sin categoría"}</span><ChevronDown aria-hidden />
      </button>
      {open && (
        <div className="catpick-menu" role="listbox" aria-label={`Categoría de ${p.name}`}>
          <div className="catpick-h">Mover a…</div>
          {GROUPS.map((g) => (
            <div key={g.key} role="group" aria-label={g.name}>
              <div className="catpick-g">{g.name}</div>
              {list.filter((c) => groupOf(c) === g.key).map((c) => (
                <button type="button" role="option" aria-selected={c.id === p.category_id} key={c.id} onClick={() => { setOpen(false); if (c.id !== p.category_id) onPick(c.id); }}>
                  <span>{c.name}</span>{c.id === p.category_id && <Check aria-hidden />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductsTable({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"activos" | "archivados">("activos");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [catOverride, setCatOverride] = useState<Record<string, string>>({});
  const cat = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "Sin categoría";

  const moveTo = (p: Product, categoryId: string) => {
    setCatOverride((o) => ({ ...o, [p.id]: categoryId }));
    start(async () => {
      const r = await updateProductFlags(p.id, { category_id: categoryId });
      if (!r.ok) setCatOverride((o) => { const n = { ...o }; delete n[p.id]; return n; });
      setMsg(r.ok ? { ok: true, text: `“${p.name}” ahora está en ${cat(categoryId)}.` } : { ok: false, text: r.error });
      router.refresh();
    });
  };

  const remove = (p: Product) => {
    setConfirmDel(null);
    setGone((g) => new Set(g).add(p.id));
    start(async () => {
      const r = await deleteProduct(p.id);
      if (!r.ok) setGone((g) => { const n = new Set(g); n.delete(p.id); return n; });
      setMsg(r.ok ? { ok: true, text: `Se eliminó “${p.name}”.` } : { ok: false, text: r.error });
      router.refresh();
    });
  };

  const rows = useMemo(() => {
    const w = searchable(q).split(" ").filter(Boolean);
    return products
      .filter((p) => !gone.has(p.id))
      .map((p) => (catOverride[p.id] ? { ...p, category_id: catOverride[p.id] } : p))
      .filter((p) => (show === "archivados" ? p.archived : !p.archived))
      .filter((p) => !w.length || w.every((x) => searchable(`${p.name} ${p.sku}`).includes(x)));
  }, [products, q, show, gone, catOverride]);

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
                <td><CategoryPicker p={p} categories={categories} disabled={pending} onPick={(id) => moveTo(p, id)} /></td>
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
                  {confirmDel === p.id ? (
                    <span className="del-confirm" role="group" aria-label={`Confirmar eliminación de ${p.name}`}>
                      <span>¿Eliminar?</span>
                      <button type="button" className="btn btn-sm del-yes" onClick={() => remove(p)}><Trash2 />Sí, eliminar</button>
                      <button type="button" className="icon-btn" aria-label="Cancelar" onClick={() => setConfirmDel(null)}><X /></button>
                    </span>
                  ) : (
                    <span className="row-actions">
                      <Link className="btn btn-ghost btn-sm" href={`/admin/productos/${p.id}`}><Pencil />Editar</Link>
                      {show === "archivados" && <button className="btn btn-ghost btn-sm" onClick={() => flag(p, { archived: false }, "Producto desarchivado.")}>Desarchivar</button>}
                      <button type="button" className="icon-btn del-btn" aria-label={`Eliminar ${p.name}`} title="Eliminar producto" disabled={pending} onClick={() => setConfirmDel(p.id)}><Trash2 /></button>
                    </span>
                  )}
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
