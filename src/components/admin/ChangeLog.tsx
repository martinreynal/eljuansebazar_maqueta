"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Bot, Download, Loader2, NotebookPen, Plus, Search, Settings2, Trash2, X } from "lucide-react";
import { addChangeNote, deleteChangeNote } from "@/app/admin/actions";
import { searchable } from "@/lib/format";

export type ChangeRow = { id: number; created_at: string; author: string; source: "panel" | "claude" | "manual"; area: string; title: string; detail: string; ref: string };

const AREAS = ["Productos", "Categorías", "Imágenes", "Carrusel", "Portada", "Catálogo", "Diseño", "Personalizados", "Nosotros", "Configuración", "Panel", "General"];
const SOURCES: Record<ChangeRow["source"], { label: string; Icon: typeof Bot }> = {
  panel: { label: "Panel", Icon: Settings2 },
  claude: { label: "Claude", Icon: Bot },
  manual: { label: "Nota", Icon: NotebookPen },
};
const TZ = "America/Argentina/Buenos_Aires";
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const dayLabel = (iso: string) => {
  const k = dayKey(iso), today = dayKey(new Date().toISOString()), yest = dayKey(new Date(Date.now() - 864e5).toISOString());
  const txt = new Date(iso).toLocaleDateString("es-AR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return k === today ? `Hoy · ${txt}` : k === yest ? `Ayer · ${txt}` : txt.charAt(0).toUpperCase() + txt.slice(1);
};
const time = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function ChangeLog({ rows: initial }: { rows: ChangeRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<"" | ChangeRow["source"]>("");
  const [area, setArea] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ area: "General", title: "", detail: "", ref: "" });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const areas = useMemo(() => [...new Set([...AREAS, ...rows.map((r) => r.area)])], [rows]);
  const list = useMemo(() => {
    const w = searchable(q).split(" ").filter(Boolean);
    return rows.filter((r) => (!src || r.source === src) && (!area || r.area === area) && (!w.length || w.every((x) => searchable(`${r.title} ${r.detail} ${r.ref} ${r.author} ${r.area}`).includes(x))));
  }, [rows, q, src, area]);
  const groups = useMemo(() => {
    const m = new Map<string, ChangeRow[]>();
    for (const r of list) { const k = dayKey(r.created_at); m.set(k, [...(m.get(k) ?? []), r]); }
    return [...m.values()];
  }, [list]);
  const count = (s: ChangeRow["source"]) => rows.filter((r) => r.source === s).length;

  const save = () =>
    start(async () => {
      setErr("");
      const r = await addChangeNote(form);
      if (!r.ok) { setErr(r.error); return; }
      setRows((v) => [{ id: r.data!.id, created_at: new Date().toISOString(), author: "vos", source: "manual", ...form }, ...v]);
      setForm({ area: form.area, title: "", detail: "", ref: "" });
      setOpen(false);
      router.refresh();
    });
  const remove = (id: number) =>
    start(async () => {
      const r = await deleteChangeNote(id);
      if (r.ok) setRows((v) => v.filter((x) => x.id !== id));
    });
  const csv = () => {
    const esc = (x: string) => `"${x.replace(/"/g, '""')}"`;
    const body = ["Fecha;Hora;Origen;Sección;Cambio;Detalle;Referencia;Autor", ...list.map((r) => [dayKey(r.created_at), time(r.created_at), SOURCES[r.source].label, r.area, r.title, r.detail, r.ref, r.author].map(esc).join(";"))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
    a.download = `historial-saggio-${dayKey(new Date().toISOString())}.csv`;
    a.click();
  };

  return (
    <>
      <div className="adm-h">
        <div>
          <h2>Textos · Historial de cambios</h2>
          <p>{rows.length} cambios registrados · {count("panel")} desde el panel · {count("claude")} de Claude · {count("manual")} notas</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={csv} disabled={!list.length}><Download />Descargar</button>
          <button className="btn btn-dark btn-sm" onClick={() => setOpen((o) => !o)}>{open ? <X /> : <Plus />}{open ? "Cerrar" : "Agregar nota"}</button>
        </div>
      </div>

      {open && (
        <div className="cl-form">
          <div className="cl-form-row">
            <label><span>Sección</span>
              <select className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>{areas.map((a) => <option key={a}>{a}</option>)}</select>
            </label>
            <label style={{ flex: 3 }}><span>Qué se cambió</span>
              <input className="input" autoFocus value={form.title} maxLength={300} placeholder="Ej.: Se pidieron fotos nuevas de la Silla Tivoli al proveedor" onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label><span>Referencia (opcional)</span>
              <input className="input" value={form.ref} maxLength={200} placeholder="SKU, cliente…" onChange={(e) => setForm({ ...form, ref: e.target.value })} />
            </label>
          </div>
          <label><span>Detalle (opcional)</span>
            <textarea className="input" rows={3} value={form.detail} maxLength={2000} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
          </label>
          {err && <div className="adm-msg bad">{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-dark btn-sm" disabled={pending || form.title.trim().length < 3} onClick={save}>{pending ? <Loader2 className="spin" /> : <Plus />}Guardar nota</button>
          </div>
        </div>
      )}

      <div className="cl-filters">
        <div className="search" style={{ display: "flex", flex: "1 1 260px", maxWidth: 420 }}><Search aria-hidden /><input type="search" placeholder="Buscar en el historial (producto, SKU, texto…)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el historial" /></div>
        <select className="input" style={{ width: "auto", minWidth: 180, height: 42 }} value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filtrar por sección">
          <option value="">Todas las secciones</option>
          {areas.filter((a) => rows.some((r) => r.area === a)).map((a) => <option key={a}>{a}</option>)}
        </select>
        <div className="seg" role="group" aria-label="Origen">
          <button aria-pressed={src === ""} onClick={() => setSrc("")}>Todo</button>
          {(Object.keys(SOURCES) as ChangeRow["source"][]).map((k) => <button key={k} aria-pressed={src === k} onClick={() => setSrc(k)}>{SOURCES[k].label}</button>)}
        </div>
        <span className="hint">{list.length} resultado{list.length === 1 ? "" : "s"}</span>
      </div>

      {!list.length && <div className="cl-empty">No hay cambios que coincidan con la búsqueda.</div>}
      <div className="cl">
        {groups.map((g) => (
          <section key={dayKey(g[0].created_at)} className="cl-day">
            <h3>{dayLabel(g[0].created_at)} <small>{g.length} cambio{g.length === 1 ? "" : "s"}</small></h3>
            <ol>
              {g.map((r) => {
                const S = SOURCES[r.source];
                return (
                  <li key={r.id} className={`cl-item src-${r.source}`}>
                    <time>{time(r.created_at)}</time>
                    <span className="cl-dot" aria-hidden><S.Icon /></span>
                    <div className="cl-body">
                      <div className="cl-top">
                        <span className="cl-area">{r.area}</span>
                        <span className="cl-src">{S.label}{r.author && r.source !== "claude" ? ` · ${r.author}` : ""}</span>
                        {r.ref && <span className="cl-ref mono">{r.ref}</span>}
                      </div>
                      <p className="cl-title">{r.title}</p>
                      {r.detail && <p className="cl-detail">{r.detail}</p>}
                    </div>
                    {r.source === "manual" && <button className="icon-btn cl-del" title="Borrar nota" aria-label="Borrar nota" disabled={pending} onClick={() => { if (confirm("¿Borrar esta nota del historial?")) remove(r.id); }}><Trash2 /></button>}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
