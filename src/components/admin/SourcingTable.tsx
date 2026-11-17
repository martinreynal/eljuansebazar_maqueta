"use client";
import { useMemo, useState, useTransition } from "react";
import { Check, Download, ExternalLink, Loader2, Pencil, Search, X } from "lucide-react";
import { saveSourcing, type SourcingInput } from "@/app/admin/actions";
import { searchable } from "@/lib/format";
import { groupOf, GROUPS } from "@/lib/groups";
import type { Category, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

export type SourcingRow = {
  product_id: string; supplier: string; link: string; cost: number | null; currency: "USD" | "ARS" | "CNY" | "EUR"; moq: number | null; lead_time: string;
  units_per_box: number | null; box_volume_m3: number | null; box_weight_kg: number | null; box_dimensions: string; material_measures: string;
  certifications: string; restock: string; photos_authorized: "" | "si" | "no" | "consultar"; photos_note: string; notes: string; updated_at: string; updated_by: string;
};
const EMPTY: Omit<SourcingRow, "product_id" | "updated_at" | "updated_by"> = {
  supplier: "", link: "", cost: null, currency: "USD", moq: null, lead_time: "", units_per_box: null, box_volume_m3: null, box_weight_kg: null,
  box_dimensions: "", material_measures: "", certifications: "", restock: "", photos_authorized: "", photos_note: "", notes: "",
};
const PHOTOS: Record<string, string> = { si: "Sí", no: "No", consultar: "A consultar", "": "—" };
const CUR: Record<string, string> = { USD: "US$", ARS: "$", CNY: "¥", EUR: "€" };
const money = (n: number | null, c: string) => (n == null ? "—" : `${CUR[c] ?? ""} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const num = (n: number | null, suf = "") => (n == null ? "—" : `${n.toLocaleString("es-AR")}${suf}`);
/** Cuántos de los 10 datos pedidos están completos. */
const FIELDS: (keyof SourcingRow)[] = ["link", "cost", "moq", "lead_time", "units_per_box", "box_volume_m3", "material_measures", "certifications", "restock", "photos_authorized"];
const filled = (r?: SourcingRow) => (r ? FIELDS.filter((k) => r[k] !== null && r[k] !== "" && r[k] !== undefined).length : 0);

type Draft = { p: Product; v: typeof EMPTY; saving: boolean; error?: string };

/**
 * Contracara de los productos: lo que no se ve en la web (proveedor, link, precio de compra, pedido mínimo,
 * plazos, embalaje, certificaciones, reposición y si las fotos están autorizadas). Solo para administradores.
 */
export function SourcingTable({ products, categories, rows: initial }: { products: Product[]; categories: Category[]; rows: SourcingRow[] }) {
  const [rows, setRows] = useState(() => new Map(initial.map((r) => [r.product_id, r])));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [state, setState] = useState<"" | "con" | "sin" | "incompletos">("");
  const [edit, setEdit] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");
  const [, start] = useTransition();
  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const list = useMemo(() => {
    const w = searchable(q).split(" ").filter(Boolean);
    return products.filter((p) => {
      const r = rows.get(p.id), f = filled(r);
      if (cat && p.category_id !== cat) return false;
      if (state === "con" && !f) return false;
      if (state === "sin" && f) return false;
      if (state === "incompletos" && (!f || f === FIELDS.length)) return false;
      if (w.length) {
        const hay = searchable(`${p.sku} ${p.name} ${catName.get(p.category_id ?? "") ?? ""} ${r?.supplier ?? ""} ${r?.notes ?? ""}`);
        if (!w.every((x) => hay.includes(x))) return false;
      }
      return true;
    });
  }, [products, rows, q, cat, state, catName]);
  const withData = products.filter((p) => filled(rows.get(p.id))).length;

  const open = (p: Product) => {
    const r = rows.get(p.id);
    const base = r ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, r[k as keyof SourcingRow]])) } : { ...EMPTY };
    if (!base.material_measures) base.material_measures = [p.materials, p.dimensions].filter(Boolean).join(" · ");
    setEdit({ p, v: base as typeof EMPTY, saving: false });
  };
  const set = <K extends keyof typeof EMPTY>(k: K, val: (typeof EMPTY)[K]) => setEdit((e) => (e ? { ...e, v: { ...e.v, [k]: val }, error: undefined } : e));
  const save = () =>
    start(async () => {
      if (!edit) return;
      setEdit({ ...edit, saving: true });
      const r = await saveSourcing({ product_id: edit.p.id, ...edit.v } as SourcingInput);
      if (!r.ok) { setEdit({ ...edit, saving: false, error: r.error }); return; }
      setRows((m) => new Map(m).set(edit.p.id, { ...edit.v, product_id: edit.p.id, updated_at: r.data!.updated_at, updated_by: "vos" }));
      setMsg(`Se guardó la contracara de ${edit.p.name}.`);
      setEdit(null);
    });

  const csv = () => {
    const esc = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
    const head = ["Código", "Producto", "Categoría", "Proveedor", "Link", "Precio de compra", "Moneda", "MOQ", "Plazo de producción", "Unidades por caja", "Volumen por caja (m³)", "Peso por caja (kg)", "Medidas de la caja", "Material y medidas", "Certificaciones", "Reposición", "Fotos autorizadas", "Nota fotos", "Notas", "Actualizado"];
    const body = list.map((p) => { const r = rows.get(p.id); return [p.sku, p.name, catName.get(p.category_id ?? ""), r?.supplier, r?.link, r?.cost, r?.currency, r?.moq, r?.lead_time, r?.units_per_box, r?.box_volume_m3, r?.box_weight_kg, r?.box_dimensions, r?.material_measures, r?.certifications, r?.restock, PHOTOS[r?.photos_authorized ?? ""], r?.photos_note, r?.notes, r?.updated_at?.slice(0, 10)].map(esc).join(";"); });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + [head.map(esc).join(";"), ...body].join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `contracara-saggio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <>
      <div className="adm-h">
        <div>
          <h2>Contracara de productos</h2>
          <p>Datos internos de compra y logística. No se muestran en la web. {withData} de {products.length} productos con datos cargados.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={csv} disabled={!list.length}><Download />Descargar planilla</button>
      </div>

      <div className="cl-filters">
        <div className="search" style={{ display: "flex", flex: "1 1 260px", maxWidth: 420 }}><Search aria-hidden /><input type="search" placeholder="Buscar por código, nombre o proveedor" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" /></div>
        <select className="input" style={{ width: "auto", minWidth: 200, height: 42 }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {GROUPS.map((g) => <optgroup key={g.key} label={g.name}>{categories.filter((c) => groupOf(c) === g.key && products.some((p) => p.category_id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (inactiva)"}</option>)}</optgroup>)}
        </select>
        <div className="seg" role="group" aria-label="Estado de los datos">
          {([["", "Todos"], ["con", "Con datos"], ["incompletos", "Incompletos"], ["sin", "Sin datos"]] as const).map(([k, t]) => <button key={k} aria-pressed={state === k} onClick={() => setState(k)}>{t}</button>)}
        </div>
        <span className="hint">{list.length} producto{list.length === 1 ? "" : "s"}</span>
      </div>
      {msg && <div className="adm-msg ok" style={{ marginBottom: 12 }}><Check />{msg}</div>}

      <div className="tbl-wrap">
        <table className="tbl src-tbl">
          <thead>
            <tr>
              <th>Producto</th><th>Link</th><th className="num">Precio de compra</th><th className="num">MOQ</th><th>Plazo de producción</th><th className="num">Unid. por caja</th>
              <th>Volumen y peso embalado</th><th>Material y medidas</th><th>Certificaciones</th><th>Reposición</th><th>Fotos autorizadas</th><th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const r = rows.get(p.id), f = filled(r);
              return (
                <tr key={p.id} className={p.visible ? "" : "muted"}>
                  <td>
                    <div className="pt">
                      <div className="t"><ProductImage p={p} label={false} sizes="42px" /></div>
                      <div style={{ minWidth: 0 }}>
                        <div className="src-name">{p.name}</div>
                        <small className="mono">{p.sku}</small> <small className="hint">· {catName.get(p.category_id ?? "")}{r?.supplier ? ` · ${r.supplier}` : ""}</small>
                        <div className="src-fill" title={`${f} de ${FIELDS.length} datos`}><i style={{ width: `${(f / FIELDS.length) * 100}%` }} /></div>
                      </div>
                    </div>
                  </td>
                  <td>{r?.link ? <a className="src-link" href={r.link} target="_blank" rel="noopener noreferrer" title={r.link}><ExternalLink />Abrir</a> : "—"}</td>
                  <td className="num">{money(r?.cost ?? null, r?.currency ?? "USD")}</td>
                  <td className="num">{num(r?.moq ?? null)}</td>
                  <td>{r?.lead_time || "—"}</td>
                  <td className="num">{num(r?.units_per_box ?? null)}</td>
                  <td>{r && (r.box_volume_m3 != null || r.box_weight_kg != null || r.box_dimensions) ? <>{num(r.box_volume_m3, " m³")} · {num(r.box_weight_kg, " kg")}{r.box_dimensions ? <><br /><small className="hint">{r.box_dimensions}</small></> : null}</> : "—"}</td>
                  <td className="src-txt">{r?.material_measures || <span className="hint">{[p.materials, p.dimensions].filter(Boolean).join(" · ") || "—"}</span>}</td>
                  <td className="src-txt">{r?.certifications || "—"}</td>
                  <td className="src-txt">{r?.restock || "—"}</td>
                  <td>{r?.photos_authorized ? <span className={`src-ph ph-${r.photos_authorized}`}>{PHOTOS[r.photos_authorized]}</span> : "—"}{r?.photos_note ? <><br /><small className="hint">{r.photos_note}</small></> : null}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => open(p)}><Pencil />{f ? "Editar" : "Cargar"}</button></td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={12} style={{ textAlign: "center", padding: 30 }} className="hint">No hay productos que coincidan.</td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="lens-bg" onMouseDown={(e) => { if (e.target === e.currentTarget && !edit.saving) setEdit(null); }}>
          <div className="lens-modal src-modal" role="dialog" aria-modal="true" aria-label={`Contracara de ${edit.p.name}`}>
            <div className="lens-head">
              <div><small className="mono">{edit.p.sku}</small><h3>{edit.p.name}</h3></div>
              <button className="icon-btn" aria-label="Cerrar" disabled={edit.saving} onClick={() => setEdit(null)}><X /></button>
            </div>
            <div className="src-form">
              <label><span>Proveedor</span><input className="input" value={edit.v.supplier} onChange={(e) => set("supplier", e.target.value)} /></label>
              <label className="wide"><span>Link al producto</span><input className="input" type="url" placeholder="https://…" value={edit.v.link} onChange={(e) => set("link", e.target.value)} /></label>
              <label><span>Precio de compra</span>
                <div className="src-money">
                  <select className="input" value={edit.v.currency} onChange={(e) => set("currency", e.target.value as typeof EMPTY.currency)}>{Object.keys(CUR).map((c) => <option key={c}>{c}</option>)}</select>
                  <input className="input" inputMode="decimal" placeholder="0,00" value={edit.v.cost ?? ""} onChange={(e) => set("cost", (e.target.value as unknown) as number)} />
                </div>
              </label>
              <label><span>MOQ (pedido mínimo, unidades)</span><input className="input" inputMode="numeric" value={edit.v.moq ?? ""} onChange={(e) => set("moq", (e.target.value as unknown) as number)} /></label>
              <label><span>Plazo de producción</span><input className="input" placeholder="Ej.: 30 a 45 días" value={edit.v.lead_time} onChange={(e) => set("lead_time", e.target.value)} /></label>
              <label><span>Unidades por caja</span><input className="input" inputMode="numeric" value={edit.v.units_per_box ?? ""} onChange={(e) => set("units_per_box", (e.target.value as unknown) as number)} /></label>
              <label><span>Volumen embalado (m³ por caja)</span><input className="input" inputMode="decimal" placeholder="Ej.: 0,085" value={edit.v.box_volume_m3 ?? ""} onChange={(e) => set("box_volume_m3", (e.target.value as unknown) as number)} /></label>
              <label><span>Peso embalado (kg por caja)</span><input className="input" inputMode="decimal" placeholder="Ej.: 12,5" value={edit.v.box_weight_kg ?? ""} onChange={(e) => set("box_weight_kg", (e.target.value as unknown) as number)} /></label>
              <label><span>Medidas de la caja</span><input className="input" placeholder="Ej.: 60 × 45 × 32 cm" value={edit.v.box_dimensions} onChange={(e) => set("box_dimensions", e.target.value)} /></label>
              <label className="wide"><span>Material y medidas</span><textarea className="input" rows={2} value={edit.v.material_measures} onChange={(e) => set("material_measures", e.target.value)} /></label>
              <label className="wide"><span>Certificaciones aplicables</span><textarea className="input" rows={2} placeholder="Ej.: FDA, LFGB, apto lavavajillas, ignífugo…" value={edit.v.certifications} onChange={(e) => set("certifications", e.target.value)} /></label>
              <label className="wide"><span>Opciones de reposición</span><textarea className="input" rows={2} placeholder="Ej.: stock permanente en depósito, a pedido con 60 días…" value={edit.v.restock} onChange={(e) => set("restock", e.target.value)} /></label>
              <label><span>Fotografías autorizadas</span>
                <select className="input" value={edit.v.photos_authorized} onChange={(e) => set("photos_authorized", e.target.value as typeof EMPTY.photos_authorized)}>
                  <option value="">Sin dato</option><option value="si">Sí</option><option value="no">No</option><option value="consultar">A consultar</option>
                </select>
              </label>
              <label><span>Nota sobre las fotos</span><input className="input" placeholder="Ej.: solo con marca de agua" value={edit.v.photos_note} onChange={(e) => set("photos_note", e.target.value)} /></label>
              <label className="wide"><span>Notas internas</span><textarea className="input" rows={2} value={edit.v.notes} onChange={(e) => set("notes", e.target.value)} /></label>
            </div>
            {edit.error && <div className="adm-msg bad" style={{ marginTop: 10 }}>{edit.error}</div>}
            <div className="lens-actions">
              <button className="btn btn-ghost" disabled={edit.saving} onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn btn-dark" disabled={edit.saving} onClick={save}>{edit.saving ? <Loader2 className="spin" /> : <Check />}Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
