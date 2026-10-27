"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { deleteCategory, reorderCategories, saveCategory, updateProductFlags } from "@/app/admin/actions";
import { GROUPS, groupOf } from "@/lib/groups";
import type { Category, CategoryGroup, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";
import { ImageUploader } from "./ImageUploader";

export function CategoriesEditor({ categories, counts, products }: { categories: Category[]; counts: Record<string, number>; products: Product[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; active: boolean; image: string[]; grupo: CategoryGroup | null }>>(
    Object.fromEntries(categories.map((c) => [c.id, { name: c.name, active: c.active, image: c.image_path ? [c.image_path] : [], grupo: groupOf(c) }])),
  );
  const [confirm, setConfirm] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const after = (r: { ok: boolean; error?: string }, text: string) => { setMsg(r.ok ? { ok: true, text } : { ok: false, text: r.error ?? "Error" }); router.refresh(); };
  const move = (i: number, d: number) => {
    const ids = categories.map((c) => c.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    start(async () => after(await reorderCategories(ids), "Orden actualizado."));
  };
  const save = (c: Category) => {
    const d = drafts[c.id];
    start(async () => after(await saveCategory({ id: c.id, name: d.name, active: d.active, image_path: d.image[0] ?? null, grupo: c.is_offers ? null : d.grupo }), `Categoría “${d.name}” guardada.`));
  };

  return (
    <>
      <div className="adm-h"><div><h2>Categorías</h2><p>El orden de esta lista es el que se ve en la tienda. Cada categoría pertenece a un grupo: Bazar o Mobiliario.</p></div></div>
      {msg && <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} role="status">{msg.text}</div>}
      <div className="panel" aria-busy={pending}>
        {categories.map((c, i) => {
          const d = drafts[c.id] ?? { name: c.name, active: c.active, image: [], grupo: groupOf(c) };
          const dirty = d.name !== c.name || d.active !== c.active || (d.image[0] ?? null) !== c.image_path || d.grupo !== groupOf(c);
          const setD = (patch: Partial<typeof d>) => setDrafts((x) => ({ ...x, [c.id]: { ...d, ...patch } }));
          return (
            <div key={c.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
              <div className="cat-row" style={{ borderBottom: 0, padding: 0 }}>
                <div className="mv">
                  <button onClick={() => move(i, -1)} disabled={i === 0 || pending} aria-label={`Subir ${c.name}`}><ChevronUp /></button>
                  <button onClick={() => move(i, 1)} disabled={i === categories.length - 1 || pending} aria-label={`Bajar ${c.name}`}><ChevronDown /></button>
                </div>
                <span className="hint cnt" style={{ textAlign: "center" }}>{counts[c.id] ?? 0}<br />prod.</span>
                <div className="field">
                  <input className="input" value={d.name} onChange={(e) => setD({ name: e.target.value })} aria-label="Nombre de la categoría" />
                  {c.is_offers && <span className="hint">Muestra los productos con la etiqueta Oferta.</span>}
                </div>
                {c.is_offers ? <span /> : (
                  <select className="input" style={{ width: 130 }} value={d.grupo ?? "bazar"} onChange={(e) => setD({ grupo: e.target.value as CategoryGroup })} aria-label={`Grupo de ${c.name}`}>
                    {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.name}</option>)}
                  </select>
                )}
                <label className="switch" title="Activa"><input type="checkbox" checked={d.active} onChange={(e) => setD({ active: e.target.checked })} aria-label={`Categoría activa: ${c.name}`} /><span /></label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-dark btn-sm" onClick={() => save(c)} disabled={!dirty || pending}><Check />Guardar</button>
                  {!c.is_offers && <button className="icon-btn" style={{ color: "var(--bad)" }} onClick={() => setConfirm(c.id)} aria-label={`Eliminar ${c.name}`}><Trash2 /></button>}
                </div>
              </div>
              {!c.is_offers && <CategoryProducts category={c} categories={categories} products={products} />}
              {!c.is_offers && (
                <details style={{ marginTop: 8 }}>
                  <summary className="hint" style={{ cursor: "pointer" }}>Imagen de portada {c.image_path ? "(cargada)" : "(opcional)"}</summary>
                  <div style={{ marginTop: 8 }}><ImageUploader value={d.image} onChange={(v) => setD({ image: v })} folder="categories" max={1} label="Foto de la categoría" /></div>
                </details>
              )}
              {confirm === c.id && (
                <div className="confirm" style={{ marginTop: 8 }}>
                  <span>¿Eliminar la categoría <b>{c.name}</b>? Solo se puede si no tiene productos.</span>
                  <div>
                    <button className="btn btn-sm" style={{ background: "var(--bad)", color: "var(--surface)" }} onClick={() => start(async () => { const r = await deleteCategory(c.id); setConfirm(null); after(r, "Categoría eliminada."); })}>Eliminar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <form style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }} onSubmit={(e) => { e.preventDefault(); if (newName.trim().length < 2) return setMsg({ ok: false, text: "Escribí un nombre de al menos 2 letras." }); start(async () => { const r = await saveCategory({ name: newName, active: true, image_path: null }); if (r.ok) setNewName(""); after(r, "Categoría creada."); }); }}>
          <input className="input" style={{ flex: "1 1 220px" }} placeholder="Nombre de la nueva categoría" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="Nombre de la nueva categoría" />
          <button className="btn btn-ghost" type="submit" disabled={pending}><Plus />Agregar categoría</button>
        </form>
      </div>
    </>
  );
}

/** Listado desplegable de los productos de una categoría, con cambio rápido de categoría. */
function CategoryProducts({ category, categories, products }: { category: Category; categories: Category[]; products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const list = products.filter((p) => (moved[p.id] ?? p.category_id) === category.id);
  const term = q.trim().toLowerCase();
  const shown = term ? list.filter((p) => `${p.sku} ${p.name}`.toLowerCase().includes(term)) : list;
  const targets = categories.filter((c) => !c.is_offers);

  const move = async (p: Product, to: string) => {
    if (to === category.id) return;
    setBusy(p.id); setMsg(null);
    const r = await updateProductFlags(p.id, { category_id: to });
    setBusy(null);
    if (r.ok) {
      setMoved((m) => ({ ...m, [p.id]: to }));
      setMsg({ ok: true, text: `${p.sku} pasó a “${categories.find((c) => c.id === to)?.name ?? ""}”.` });
      router.refresh();
    } else setMsg({ ok: false, text: r.error ?? "No se pudo mover el producto." });
  };

  return (
    <details className="catprod" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>Ver productos ({list.length})</summary>
      {open && (
        <div className="catprod-body">
          {list.length > 8 && <input className="input catprod-q" placeholder="Buscar por código o nombre" value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Buscar en ${category.name}`} />}
          {msg && <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} role="status">{msg.text}</div>}
          {shown.length === 0 ? <p className="hint">{list.length ? "Ningún producto coincide con la búsqueda." : "Esta categoría no tiene productos."}</p> : (
            <ul className="catprod-list">
              {shown.map((p) => (
                <li key={p.id} aria-busy={busy === p.id}>
                  <span className="catprod-img"><ProductImage p={p} label={false} sizes="44px" /></span>
                  <span className="catprod-n"><b className="mono">{p.sku}</b><span>{p.name}</span></span>
                  <select className="input catprod-sel" value={category.id} disabled={busy === p.id} onChange={(e) => move(p, e.target.value)} aria-label={`Mover ${p.name} a otra categoría`}>
                    {GROUPS.map((g) => (
                      <optgroup key={g.key} label={g.name}>
                        {targets.filter((c) => groupOf(c) === g.key).map((c) => <option key={c.id} value={c.id}>{c.id === category.id ? `${c.name} (actual)` : c.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </details>
  );
}
