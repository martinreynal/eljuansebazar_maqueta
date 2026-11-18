"use client";
import { useMemo, useState, useTransition } from "react";
import { Check, Download, ExternalLink, FileSpreadsheet, Loader2, Pencil, Search, X } from "lucide-react";
import { saveSourcing, type SourcingInput } from "@/app/admin/actions";
import { searchable } from "@/lib/format";
import { groupOf, GROUPS } from "@/lib/groups";
import type { Category, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

export type SourcingRow = {
  product_id: string; supplier: string; link: string; cost: number | null; currency: "USD" | "ARS" | "CNY" | "EUR"; moq: number | null; lead_time: string;
  units_per_box: number | null; box_volume_m3: number | null; box_weight_kg: number | null; box_dimensions: string; material_measures: string;
  certifications: string; restock: string; photos_authorized: "" | "si" | "no" | "consultar"; photos_note: string; notes: string; updated_at: string; updated_by: string;
  // Planilla de clasificación INGES
  inges_order: string; customs_name: string; customs_description: string; origin: string; operating_details: string; material_composition: string;
  sample: string; customs_notes: string; total_pcs: number | null; total_cartons: number | null; total_cbm: number | null; fob_djai: number | null;
  net_weight_g: number | null; shipping_mode: "" | "maritimo" | "aereo"; loading_port: string; hs_code: string;
};
const EMPTY: Omit<SourcingRow, "product_id" | "updated_at" | "updated_by"> = {
  supplier: "", link: "", cost: null, currency: "USD", moq: null, lead_time: "", units_per_box: null, box_volume_m3: null, box_weight_kg: null,
  box_dimensions: "", material_measures: "", certifications: "", restock: "", photos_authorized: "", photos_note: "", notes: "",
  inges_order: "", customs_name: "", customs_description: "", origin: "", operating_details: "", material_composition: "", sample: "", customs_notes: "",
  total_pcs: null, total_cartons: null, total_cbm: null, fob_djai: null, net_weight_g: null, shipping_mode: "", loading_port: "", hs_code: "",
};
const PHOTOS: Record<string, string> = { si: "Sí", no: "No", consultar: "A consultar", "": "—" };
const CUR: Record<string, string> = { USD: "US$", ARS: "$", CNY: "¥", EUR: "€" };
const money = (n: number | null, c: string) => (n == null ? "—" : `${CUR[c] ?? ""} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const num = (n: number | null, suf = "") => (n == null ? "—" : `${n.toLocaleString("es-AR")}${suf}`);
/** Cuántos de los 10 datos pedidos están completos. */
const FIELDS: (keyof SourcingRow)[] = ["link", "cost", "moq", "lead_time", "units_per_box", "box_volume_m3", "material_measures", "certifications", "restock", "photos_authorized"];
const has = (r: SourcingRow, k: keyof SourcingRow) => r[k] !== null && r[k] !== "" && r[k] !== undefined;
const filled = (r?: SourcingRow) => (r ? FIELDS.filter((k) => has(r, k)).length : 0);
/** Datos de la planilla INGES (los que pide el despachante; la foto sale de la ficha). */
const INGES: (keyof SourcingRow)[] = ["customs_name", "customs_description", "origin", "material_composition", "total_pcs", "units_per_box", "total_cartons", "box_dimensions", "total_cbm", "cost", "net_weight_g", "shipping_mode", "loading_port", "lead_time"];
const ingesFilled = (r?: SourcingRow) => (r ? INGES.filter((k) => has(r, k)).length : 0);
/** Número escrito a mano: «10.000» (miles), «0,085» o «0.085» (decimales). */
const toNum = (v: unknown) => {
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v ?? "").trim().replace(/\s/g, "");
  if (!s) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s);
  return isFinite(n) ? n : null;
};
/** Sugerencias de la planilla: cajas = unidades ÷ unidades por caja; CBM = cajas × volumen por caja. */
const calcCartons = (v: typeof EMPTY) => { const t = toNum(v.total_pcs), u = toNum(v.units_per_box); return t && u ? Math.ceil(t / u) : null; };
const calcCbm = (v: typeof EMPTY) => { const c = toNum(v.total_cartons) ?? calcCartons(v), m = toNum(v.box_volume_m3); return c && m ? Math.round(c * m * 1000) / 1000 : null; };

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
    if (!base.customs_name) base.customs_name = p.name;
    setEdit({ p, v: base as typeof EMPTY, saving: false });
  };
  const set = <K extends keyof typeof EMPTY>(k: K, val: (typeof EMPTY)[K]) => setEdit((e) => (e ? { ...e, v: { ...e.v, [k]: val }, error: undefined } : e));
  const save = (thenInges = false) =>
    start(async () => {
      if (!edit) return;
      setEdit({ ...edit, saving: true });
      // Completa cajas y CBM con la cuenta si quedaron vacíos
      const v = { ...edit.v };
      if (v.total_cartons == null || (v.total_cartons as unknown) === "") v.total_cartons = calcCartons(v);
      if (v.total_cbm == null || (v.total_cbm as unknown) === "") v.total_cbm = calcCbm(v);
      const r = await saveSourcing({ product_id: edit.p.id, ...v } as SourcingInput);
      if (!r.ok) { setEdit({ ...edit, saving: false, error: r.error }); return; }
      const norm = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof EMPTY[k as keyof typeof EMPTY] === "string" || x === null ? x : toNum(x)])) as typeof EMPTY;
      setRows((m) => new Map(m).set(edit.p.id, { ...norm, product_id: edit.p.id, updated_at: r.data!.updated_at, updated_by: "vos" }));
      setMsg(`Se guardó la contracara de ${edit.p.name}.`);
      if (thenInges) window.location.href = `/admin/contracara/inges/${edit.p.id}`;
      setEdit(null);
    });

  const csv = () => {
    const esc = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
    const head = ["Código", "Producto", "Categoría", "Proveedor", "Link", "Precio de compra", "Moneda", "MOQ", "Plazo de producción", "Unidades por caja", "Volumen por caja (m³)", "Peso por caja (kg)", "Medidas de la caja", "Material y medidas", "Certificaciones", "Reposición", "Fotos autorizadas", "Nota fotos", "Notas", "Orden INGES", "Posición arancelaria", "Nombre (aduana)", "Descripción (aduana)", "Origen", "Material constitutivo (%)", "Detalle de funcionamiento", "Muestra", "Observaciones", "Unidades totales", "Total cajas master", "Total CBM", "FOB DJAI", "Peso neto por unidad (g)", "Tipo de embarque", "Puerto de embarque", "Actualizado"];
    const body = list.map((p) => { const r = rows.get(p.id); return [p.sku, p.name, catName.get(p.category_id ?? ""), r?.supplier, r?.link, r?.cost, r?.currency, r?.moq, r?.lead_time, r?.units_per_box, r?.box_volume_m3, r?.box_weight_kg, r?.box_dimensions, r?.material_measures, r?.certifications, r?.restock, PHOTOS[r?.photos_authorized ?? ""], r?.photos_note, r?.notes, r?.inges_order, r?.hs_code, r?.customs_name, r?.customs_description, r?.origin, r?.material_composition, r?.operating_details, r?.sample, r?.customs_notes, r?.total_pcs, r?.total_cartons, r?.total_cbm, r?.fob_djai, r?.net_weight_g, r?.shipping_mode, r?.loading_port, r?.updated_at?.slice(0, 10)].map(esc).join(";"); });
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
              <th className="c-prod">Producto</th><th className="c-buy">Compra</th><th className="c-box">Embalaje</th><th className="c-imp">Importación (INGES)</th><th>Material, certificaciones y reposición</th><th className="c-ph">Fotos</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const r = rows.get(p.id), f = filled(r), fi = ingesFilled(r);
              return (
                <tr key={p.id} className={p.visible ? "" : "muted"}>
                  <td>
                    <div className="pt">
                      <div className="t"><ProductImage p={p} label={false} sizes="42px" /></div>
                      <div style={{ minWidth: 0 }}>
                        <div className="src-name">{p.name}</div>
                        <small className="mono">{p.sku}</small>{p.archived && <> <span className="pill">Archivado</span></>} <small className="hint">· {catName.get(p.category_id ?? "")}{r?.supplier ? ` · ${r.supplier}` : ""}</small>
                        <div className="src-row">
                          <div className="src-fill" title={`${f} de ${FIELDS.length} datos`}><i style={{ width: `${(f / FIELDS.length) * 100}%` }} /></div>
                          <button className="btn btn-ghost btn-sm" onClick={() => open(p)}><Pencil />{f || fi ? "Editar" : "Cargar"}</button>
                        </div>
                        <div className="src-row">
                          <div className="src-fill inges" title={`Planilla INGES: ${fi} de ${INGES.length} datos`}><i style={{ width: `${(fi / INGES.length) * 100}%` }} /></div>
                          <a className="btn btn-ghost btn-sm" href={`/admin/contracara/inges/${p.id}`} title="Descargar la planilla de clasificación INGES completada"><FileSpreadsheet />INGES</a>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <dl className="src-kv">
                      <dt>Precio</dt><dd>{money(r?.cost ?? null, r?.currency ?? "USD")}</dd>
                      <dt>MOQ</dt><dd>{num(r?.moq ?? null, " u.")}</dd>
                      <dt>Plazo</dt><dd>{r?.lead_time || "—"}</dd>
                      <dt>Link</dt><dd>{r?.link ? <a className="src-link" href={r.link} target="_blank" rel="noopener noreferrer" title={r.link}><ExternalLink />Abrir</a> : "—"}</dd>
                    </dl>
                  </td>
                  <td>
                    <dl className="src-kv">
                      <dt>Por caja</dt><dd>{num(r?.units_per_box ?? null, " u.")}</dd>
                      <dt>Volumen</dt><dd>{num(r?.box_volume_m3 ?? null, " m³")}</dd>
                      <dt>Peso</dt><dd>{num(r?.box_weight_kg ?? null, " kg")}</dd>
                      {r?.box_dimensions ? <><dt>Caja</dt><dd>{r.box_dimensions}</dd></> : null}
                    </dl>
                  </td>
                  <td>
                    <dl className="src-kv">
                      <dt>Origen</dt><dd>{r?.origin || "—"}</dd>
                      <dt>Puerto</dt><dd>{r?.loading_port || "—"}</dd>
                      <dt>Unidades</dt><dd>{num(r?.total_pcs ?? null)}{r?.total_cbm != null ? ` · ${num(r.total_cbm, " m³")}` : ""}</dd>
                      {r?.hs_code ? <><dt>Posición</dt><dd className="mono">{r.hs_code}</dd></> : null}
                    </dl>
                  </td>
                  <td className="src-txt">
                    <dl className="src-kv src-kv-txt">
                      <dt>Material</dt><dd>{r?.material_measures || <span className="hint">{[p.materials, p.dimensions].filter(Boolean).join(" · ") || "—"}</span>}</dd>
                      <dt>Certif.</dt><dd>{r?.certifications || "—"}</dd>
                      <dt>Reposición</dt><dd>{r?.restock || "—"}</dd>
                    </dl>
                  </td>
                  <td>{r?.photos_authorized ? <span className={`src-ph ph-${r.photos_authorized}`}>{PHOTOS[r.photos_authorized]}</span> : "—"}{r?.photos_note ? <><br /><small className="hint">{r.photos_note}</small></> : null}</td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 30 }} className="hint">No hay productos que coincidan.</td></tr>}
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
              <h4 className="src-sec">Compra</h4>
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
              <h4 className="src-sec">Embalaje</h4>
              <label><span>Unidades por caja master</span><input className="input" inputMode="numeric" value={edit.v.units_per_box ?? ""} onChange={(e) => set("units_per_box", (e.target.value as unknown) as number)} /></label>
              <label><span>Volumen embalado (m³ por caja)</span><input className="input" inputMode="decimal" placeholder="Ej.: 0,085" value={edit.v.box_volume_m3 ?? ""} onChange={(e) => set("box_volume_m3", (e.target.value as unknown) as number)} /></label>
              <label><span>Peso embalado (kg por caja)</span><input className="input" inputMode="decimal" placeholder="Ej.: 12,5" value={edit.v.box_weight_kg ?? ""} onChange={(e) => set("box_weight_kg", (e.target.value as unknown) as number)} /></label>
              <label><span>Medidas de la caja</span><input className="input" placeholder="Ej.: 60 × 45 × 32 cm" value={edit.v.box_dimensions} onChange={(e) => set("box_dimensions", e.target.value)} /></label>
              <h4 className="src-sec">Producto</h4>
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

              <h4 className="src-sec">Planilla INGES · Clasificación arancelaria</h4>
              <p className="src-sec-note">Lo que pide el despachante para clasificar el producto. Se descarga en su planilla, con la foto principal pegada.</p>
              <label><span>Orden de clasificación</span><input className="input" value={edit.v.inges_order} onChange={(e) => set("inges_order", e.target.value)} /></label>
              <label><span>Posición arancelaria (resultado)</span><input className="input" placeholder="Ej.: 6911.10.19" value={edit.v.hs_code} onChange={(e) => set("hs_code", e.target.value)} /></label>
              <label className="wide"><span>Nombre del producto / Product name</span><input className="input" value={edit.v.customs_name} onChange={(e) => set("customs_name", e.target.value)} /></label>
              <label className="wide"><span>Descripción del producto / Product description</span><textarea className="input" rows={2} placeholder={edit.p.name} value={edit.v.customs_description} onChange={(e) => set("customs_description", e.target.value)} /></label>
              <label><span>Origen / Origin</span><input className="input" placeholder="Ej.: China" value={edit.v.origin} onChange={(e) => set("origin", e.target.value)} /></label>
              <label><span>Material constitutivo (%)</span><input className="input" placeholder="Ej.: Cerámica 100%" value={edit.v.material_composition} onChange={(e) => set("material_composition", e.target.value)} /></label>
              <label className="wide"><span>Detalle de funcionamiento (si corresponde)</span><textarea className="input" rows={2} value={edit.v.operating_details} onChange={(e) => set("operating_details", e.target.value)} /></label>
              <label><span>Muestra</span><input className="input" placeholder="Ej.: Sí, enviada el 10/12" value={edit.v.sample} onChange={(e) => set("sample", e.target.value)} /></label>
              <label><span>Observaciones</span><input className="input" value={edit.v.customs_notes} onChange={(e) => set("customs_notes", e.target.value)} /></label>

              <h4 className="src-sec">Planilla INGES · Costeo de previsión</h4>
              <p className="src-sec-note">FOB real, unidades por caja, medidas de la caja y tiempo de producción se toman de los datos de arriba.</p>
              <label><span>Unidades totales</span><input className="input" inputMode="numeric" value={edit.v.total_pcs ?? ""} onChange={(e) => set("total_pcs", (e.target.value as unknown) as number)} /></label>
              <label><span>Total cajas master</span><input className="input" inputMode="numeric" placeholder={calcCartons(edit.v) != null ? `Se calcula: ${calcCartons(edit.v)}` : "Unidades ÷ unidades por caja"} value={edit.v.total_cartons ?? ""} onChange={(e) => set("total_cartons", (e.target.value as unknown) as number)} /></label>
              <label><span>Total CBM (m³)</span><input className="input" inputMode="decimal" placeholder={calcCbm(edit.v) != null ? `Se calcula: ${String(calcCbm(edit.v)).replace(".", ",")}` : "Cajas × volumen por caja"} value={edit.v.total_cbm ?? ""} onChange={(e) => set("total_cbm", (e.target.value as unknown) as number)} /></label>
              <label><span>FOB DJAI</span><input className="input" inputMode="decimal" placeholder="0,00" value={edit.v.fob_djai ?? ""} onChange={(e) => set("fob_djai", (e.target.value as unknown) as number)} /></label>
              <label><span>Peso neto por unidad (g)</span><input className="input" inputMode="decimal" value={edit.v.net_weight_g ?? ""} onChange={(e) => set("net_weight_g", (e.target.value as unknown) as number)} /></label>
              <label><span>Tipo de embarque</span>
                <select className="input" value={edit.v.shipping_mode} onChange={(e) => set("shipping_mode", e.target.value as typeof EMPTY.shipping_mode)}>
                  <option value="">Sin dato</option><option value="maritimo">Marítimo</option><option value="aereo">Aéreo</option>
                </select>
              </label>
              <label className="wide"><span>Puerto de embarque / Port of loading</span><input className="input" placeholder="Ej.: Guangzhou, China" value={edit.v.loading_port} onChange={(e) => set("loading_port", e.target.value)} /></label>
            </div>
            {edit.error && <div className="adm-msg bad" style={{ marginTop: 10 }}>{edit.error}</div>}
            <div className="lens-actions">
              <button className="btn btn-ghost" disabled={edit.saving} onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn btn-ghost" disabled={edit.saving} onClick={() => save(true)} title="Guarda y descarga la planilla INGES completada"><FileSpreadsheet />Guardar y descargar INGES</button>
              <button className="btn btn-dark" disabled={edit.saving} onClick={() => save()}>{edit.saving ? <Loader2 className="spin" /> : <Check />}Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
