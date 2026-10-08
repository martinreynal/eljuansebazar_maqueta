"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { deleteCategory, reorderCategories, saveCategory } from "@/app/admin/actions";
import type { Category } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";

export function CategoriesEditor({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; active: boolean; image: string[] }>>(
    Object.fromEntries(categories.map((c) => [c.id, { name: c.name, active: c.active, image: c.image_path ? [c.image_path] : [] }])),
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
    start(async () => after(await saveCategory({ id: c.id, name: d.name, active: d.active, image_path: d.image[0] ?? null }), `Categoría “${d.name}” guardada.`));
  };

  return (
    <>
      <div className="adm-h"><div><h2>Categorías</h2><p>El orden de esta lista es el que se ve en la tienda.</p></div></div>
      {msg && <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} role="status">{msg.text}</div>}
      <div className="panel" aria-busy={pending}>
        {categories.map((c, i) => {
          const d = drafts[c.id] ?? { name: c.name, active: c.active, image: [] };
          const dirty = d.name !== c.name || d.active !== c.active || (d.image[0] ?? null) !== c.image_path;
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
                <label className="switch" title="Activa"><input type="checkbox" checked={d.active} onChange={(e) => setD({ active: e.target.checked })} aria-label={`Categoría activa: ${c.name}`} /><span /></label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-dark btn-sm" onClick={() => save(c)} disabled={!dirty || pending}><Check />Guardar</button>
                  {!c.is_offers && <button className="icon-btn" style={{ color: "var(--bad)" }} onClick={() => setConfirm(c.id)} aria-label={`Eliminar ${c.name}`}><Trash2 /></button>}
                </div>
              </div>
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
