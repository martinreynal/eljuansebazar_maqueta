"use client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, GripVertical, Loader2, RotateCcw, Save } from "lucide-react";
import { resetDisplayOrder, saveDisplayOrder } from "@/app/admin/actions";
import { GROUPS, groupOf } from "@/lib/groups";
import { defaultCompare } from "@/lib/product-order";
import type { Category, Product, Settings } from "@/lib/types";
import { ProductCard } from "../ProductCard";

const COLS = [3, 4, 5, 6] as const;
const DEFAULT_COLS = 5;

/**
 * Orden de visualización: la grilla de una categoría igual a la del catálogo público,
 * para reordenar los productos arrastrando y soltando y elegir cuántos se ven por fila.
 */
export function DisplayOrderEditor({ categories, products, settings, base }: { categories: Category[]; products: Product[]; settings: Settings; base: string }) {
  const router = useRouter();
  const [catId, setCatId] = useState(categories[0]?.id ?? "");
  const cat = categories.find((c) => c.id === catId);
  const initial = (id: string) => products.filter((p) => p.category_id === id).sort((a, b) => defaultCompare(a, b)).map((p) => p.id);
  const [order, setOrder] = useState<string[]>(() => initial(catId));
  const [cols, setCols] = useState<number>(cat?.grid_cols ?? DEFAULT_COLS);
  const [dirty, setDirty] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const lastOver = useRef<string | null>(null);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const ctx = useMemo(() => ({ settings, base, categories }), [settings, base, categories]);
  const manual = products.some((p) => p.category_id === catId && p.sort_order != null);

  const pick = (id: string) => {
    if (dirty && !confirm("Hay cambios sin guardar en esta categoría. ¿Descartarlos y cambiar de categoría?")) return;
    const c = categories.find((x) => x.id === id);
    setCatId(id); setOrder(initial(id)); setCols(c?.grid_cols ?? DEFAULT_COLS); setDirty(false); setMsg(null);
  };
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= order.length) return;
    setOrder((o) => { const n = [...o]; const [x] = n.splice(from, 1); n.splice(to, 0, x); return n; });
    setDirty(true); setMsg(null);
  };
  const onOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!drag || id === drag || lastOver.current === id) return;
    lastOver.current = id;
    move(order.indexOf(drag), order.indexOf(id));
  };
  const save = () =>
    start(async () => {
      const r = await saveDisplayOrder({ categoryId: catId, ids: order, cols });
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      setDirty(false);
      setMsg({ ok: true, text: `Listo: el orden de ${cat?.name} ya se ve en la web (puede tardar unos minutos).` });
      router.refresh();
    });
  const reset = () => {
    if (!confirm(`¿Volver al orden automático en ${cat?.name}? Se borra el orden manual guardado.`)) return;
    start(async () => {
      const r = await resetDisplayOrder(catId);
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      const auto = products.filter((p) => p.category_id === catId).map((p) => ({ ...p, sort_order: null })).sort((a, b) => defaultCompare(a, b)).map((p) => p.id);
      setOrder(auto); setCols(DEFAULT_COLS); setDirty(false);
      setMsg({ ok: true, text: `${cat?.name} volvió al orden automático (por tipo y material).` });
      router.refresh();
    });
  };

  return (
    <>
      <div className="adm-h">
        <div>
          <h2>Orden de visualización</h2>
          <p>Arrastrá los productos para ordenarlos como se van a ver en el catálogo. El número indica su posición.</p>
        </div>
        {cat && <a className="btn btn-ghost btn-sm" href={`/categoria/${cat.slug}`} target="_blank" rel="noreferrer"><ExternalLink />Ver en la web</a>}
      </div>

      <div className="ord-bar">
        <label className="ord-field">
          <span>Categoría</span>
          <select className="input" value={catId} onChange={(e) => pick(e.target.value)}>
            {GROUPS.map((g) => {
              const list = categories.filter((c) => groupOf(c) === g.key);
              return list.length ? <optgroup key={g.key} label={g.name}>{list.map((c) => <option key={c.id} value={c.id}>{c.name} ({products.filter((p) => p.category_id === c.id).length})</option>)}</optgroup> : null;
            })}
            {categories.filter((c) => !groupOf(c)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="ord-field">
          <span>Productos por fila</span>
          <div className="seg" role="group" aria-label="Productos por fila">
            {COLS.map((n) => <button key={n} type="button" aria-pressed={cols === n} onClick={() => { setCols(n); setDirty(true); setMsg(null); }}>{n}</button>)}
          </div>
        </div>
        <div className="ord-actions">
          <span className={`ord-state${dirty ? " on" : ""}`}>{dirty ? "Cambios sin guardar" : manual ? "Orden manual guardado" : "Orden automático (por tipo y material)"}</span>
          {manual && <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={reset}><RotateCcw />Orden automático</button>}
          <button type="button" className="btn btn-dark" disabled={pending || !dirty} onClick={save}>{pending ? <Loader2 className="spin" /> : <Save />}Guardar cambios</button>
        </div>
      </div>
      {msg && <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} style={{ marginBottom: 14 }}>{msg.ok && <Check />}{msg.text}</div>}

      <div className="ord-grid grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {order.map((id, i) => {
          const p = byId.get(id);
          if (!p) return null;
          return (
            <div
              key={id}
              className={`ord-item${drag === id ? " dragging" : ""}`}
              draggable
              onDragStart={(e) => { setDrag(id); lastOver.current = null; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); }}
              onDragOver={(e) => onOver(e, id)}
              onDrop={(e) => { e.preventDefault(); setDrag(null); }}
              onDragEnd={() => setDrag(null)}
            >
              <span className="ord-num" aria-label={`Posición ${i + 1}`}>{i + 1}</span>
              <span className="ord-grip" aria-hidden><GripVertical /></span>
              <div className="ord-move">
                <button type="button" title="Mover antes" aria-label={`Mover ${p.name} una posición antes`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowLeft /></button>
                <button type="button" title="Mover después" aria-label={`Mover ${p.name} una posición después`} disabled={i === order.length - 1} onClick={() => move(i, i + 1)}><ArrowRight /></button>
              </div>
              <div className="ord-card"><ProductCard p={p} ctx={ctx} /></div>
            </div>
          );
        })}
      </div>
      {!order.length && <div className="cl-empty">Esta categoría no tiene productos publicados.</div>}
    </>
  );
}
