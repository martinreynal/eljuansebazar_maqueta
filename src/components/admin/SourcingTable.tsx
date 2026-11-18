"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Award, Barcode, Box, CalendarDays, Check, ChevronLeft, ChevronRight, Download, ExternalLink, FileSpreadsheet, Images, Layers, Link2,
  Loader2, Package, Pencil, Plane, RefreshCw, Search, Ship, Tag, Weight, X,
} from "lucide-react";
import { saveSourcing, type SourcingInput } from "@/app/admin/actions";
import { searchable } from "@/lib/format";
import { groupOf, GROUPS } from "@/lib/groups";
import {
  BUY_FIELDS, CUR, INGES_FIELDS, PHOTOS, countFilled, fmtMoney, fmtNum, valuesOf, type SourcingRow, type SourcingValues,
} from "@/lib/sourcing";
import type { Category, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

export type { SourcingRow } from "@/lib/sourcing";

type Draft = { p: Product; v: SourcingValues; saving: boolean; error?: string };

/** Dato con ícono (mini tarjeta). Vacío: guion tenue. */
function Kv({ icon, label, children, wide }: { icon: React.ReactNode; label: string; children?: React.ReactNode; wide?: boolean }) {
  const isEmpty = children === null || children === undefined || children === "" || children === "—";
  return (
    <div className={`ct-kv${isEmpty ? " is-empty" : ""}${wide ? " wide" : ""}`}>
      <span className="ct-ic" aria-hidden>{icon}</span>
      <div><dt>{label}</dt><dd>{isEmpty ? "—" : children}</dd></div>
    </div>
  );
}

/**
 * Contracara de los productos: lo que no se ve en la web (proveedor, link, precio de compra, pedido mínimo,
 * plazos, embalaje, importación, certificaciones, reposición y fotos). Solo para administradores.
 */
export function SourcingTable({ products, categories, rows: initial }: { products: Product[]; categories: Category[]; rows: SourcingRow[] }) {
  const [rows, setRows] = useState(() => new Map(initial.map((r) => [r.product_id, r])));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [state, setState] = useState<"" | "con" | "sin" | "incompletos">("");
  const [edit, setEdit] = useState<Draft | null>(null);
  const [photos, setPhotos] = useState<{ p: Product; i: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [, start] = useTransition();
  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const list = useMemo(() => {
    const w = searchable(q).split(" ").filter(Boolean);
    return products.filter((p) => {
      const r = rows.get(p.id), f = countFilled(r, BUY_FIELDS) + countFilled(r, INGES_FIELDS), all = BUY_FIELDS.length + INGES_FIELDS.length;
      if (cat && p.category_id !== cat) return false;
      if (state === "con" && !f) return false;
      if (state === "sin" && f) return false;
      if (state === "incompletos" && (!f || f === all)) return false;
      if (w.length) {
        const hay = searchable(`${p.sku} ${p.name} ${catName.get(p.category_id ?? "") ?? ""} ${r?.supplier ?? ""} ${r?.notes ?? ""} ${r?.hs_code ?? ""}`);
        if (!w.every((x) => hay.includes(x))) return false;
      }
      return true;
    });
  }, [products, rows, q, cat, state, catName]);
  const withData = products.filter((p) => countFilled(rows.get(p.id), BUY_FIELDS) + countFilled(rows.get(p.id), INGES_FIELDS)).length;

  // Galería: Esc cierra, flechas cambian de foto
  useEffect(() => {
    if (!photos) return;
    const n = photos.p.images.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhotos(null);
      else if (e.key === "ArrowRight" && n > 1) setPhotos((s) => s && { ...s, i: (s.i + 1) % n });
      else if (e.key === "ArrowLeft" && n > 1) setPhotos((s) => s && { ...s, i: (s.i - 1 + n) % n });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photos]);

  const open = (p: Product) => {
    const v = valuesOf(rows.get(p.id));
    if (!v.material_measures) v.material_measures = [p.materials, p.dimensions].filter(Boolean).join(" · ");
    setEdit({ p, v, saving: false });
  };
  const set = <K extends keyof SourcingValues>(k: K, val: SourcingValues[K]) => setEdit((e) => (e ? { ...e, v: { ...e.v, [k]: val }, error: undefined } : e));
  const save = (thenInges = false) =>
    start(async () => {
      if (!edit) return;
      setEdit({ ...edit, saving: true });
      const r = await saveSourcing({ product_id: edit.p.id, ...edit.v } as SourcingInput);
      if (!r.ok || !r.data) { setEdit({ ...edit, saving: false, error: r.ok ? "No se pudo guardar." : r.error }); return; }
      setRows((m) => new Map(m).set(edit.p.id, { ...r.data!.row, product_id: edit.p.id }));
      setMsg(`Se guardó la contracara de ${edit.p.name}.`);
      if (thenInges) window.location.href = `/admin/contracara/planilla/${edit.p.id}`;
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
    <div className="ct">
      <header className="ct-top">
        <div>
          <h2>Contracara de productos</h2>
          <p>Datos internos de compra, logística e importación que no se muestran en la web. {withData} de {products.length} con datos cargados.</p>
        </div>
        <button className="btn btn-terra" onClick={csv} disabled={!list.length}><Download />Descargar planilla</button>
      </header>

      <div className="ct-filters">
        <label className="ct-search"><Search aria-hidden /><input type="search" placeholder="Buscar por código, nombre o proveedor…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" /></label>
        <select className="input ct-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {GROUPS.map((g) => <optgroup key={g.key} label={g.name}>{categories.filter((c) => groupOf(c) === g.key && products.some((p) => p.category_id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (inactiva)"}</option>)}</optgroup>)}
        </select>
        <div className="ct-seg" role="group" aria-label="Estado de los datos">
          {([["", "Todos"], ["con", "Con datos"], ["incompletos", "Incompletos"], ["sin", "Sin datos"]] as const).map(([k, t]) => <button key={k} aria-pressed={state === k} onClick={() => setState(k)}>{t}</button>)}
        </div>
        <span className="ct-count">{list.length} producto{list.length === 1 ? "" : "s"} de {products.length}</span>
      </div>
      {msg && <div className="adm-msg ok" style={{ marginBottom: 12 }}><Check />{msg}</div>}

      <div className="ct-table" role="table" aria-label="Contracara de productos">
        <div className="ct-head" role="row">
          <span role="columnheader">Producto</span><span role="columnheader">Compra</span><span role="columnheader">Embalaje</span>
          <span role="columnheader">Importación (INGES)</span><span role="columnheader">Material / Certificaciones / Reposición</span><span role="columnheader">Acciones</span>
        </div>
        {list.map((p) => {
          const r = rows.get(p.id), fb = countFilled(r, BUY_FIELDS), fi = countFilled(r, INGES_FIELDS);
          return (
            <div key={p.id} className={`ct-row${p.visible || p.archived ? "" : " muted"}`} role="row">
              <div className="ct-prod" role="cell">
                <button type="button" className="ct-thumb" onClick={() => p.images.length && setPhotos({ p, i: 0 })} aria-label={`Ver fotos de ${p.name}`} disabled={!p.images.length}>
                  <ProductImage p={p} label={false} sizes="104px" />
                </button>
                <div className="ct-prod-t">
                  <b className="ct-name">{p.name}</b>
                  <span className="ct-sub"><span className="mono">{p.sku}</span> · {catName.get(p.category_id ?? "") ?? "Sin categoría"}{p.archived ? <> · <span className="pill">Archivado</span></> : null}</span>
                  {r?.supplier ? <span className="ct-sup">Proveedor: <b>{r.supplier}</b></span> : <span className="ct-sup hint">Sin proveedor</span>}
                  <div className="ct-bars">
                    <div className="ct-bar" title={`Compra: ${fb} de ${BUY_FIELDS.length} datos`}><span>Compra</span><i><b style={{ width: `${(fb / BUY_FIELDS.length) * 100}%` }} /></i><small>{fb}/{BUY_FIELDS.length}</small></div>
                    <div className="ct-bar inges" title={`Planilla INGES: ${fi} de ${INGES_FIELDS.length} datos`}><span>INGES</span><i><b style={{ width: `${(fi / INGES_FIELDS.length) * 100}%` }} /></i><small>{fi}/{INGES_FIELDS.length}</small></div>
                  </div>
                </div>
              </div>
              <dl className="ct-col" role="cell" data-label="Compra">
                <Kv icon={<Tag />} label="Precio">{r?.cost != null ? fmtMoney(r.cost, r.currency) : null}</Kv>
                <Kv icon={<Layers />} label="MOQ">{r?.moq != null ? fmtNum(r.moq, " u.") : null}</Kv>
                <Kv icon={<CalendarDays />} label="Plazo">{r?.lead_time}</Kv>
                {r?.link ? <Kv icon={<Link2 />} label="Link"><a className="ct-link" href={r.link} target="_blank" rel="noopener noreferrer" title={r.link}>Abrir<ExternalLink /></a></Kv> : null}
              </dl>
              <dl className="ct-col" role="cell" data-label="Embalaje">
                <Kv icon={<Box />} label="Por caja">{r?.units_per_box != null ? fmtNum(r.units_per_box, " u.") : null}</Kv>
                <Kv icon={<Package />} label="Volumen">{r?.box_volume_m3 != null ? fmtNum(r.box_volume_m3, " m³") : null}</Kv>
                <Kv icon={<Weight />} label="Peso">{r?.box_weight_kg != null ? fmtNum(r.box_weight_kg, " kg") : null}</Kv>
                {r?.box_dimensions ? <Kv icon={<Package />} label="Caja">{r.box_dimensions}</Kv> : null}
              </dl>
              <dl className="ct-col" role="cell" data-label="Importación (INGES)">
                <Kv icon={<Plane />} label="Origen">{r?.origin}</Kv>
                <Kv icon={<Ship />} label="Puerto">{r?.loading_port}</Kv>
                <Kv icon={<Barcode />} label="Posición / HS code">{r?.hs_code ? <span className="mono">{r.hs_code}</span> : null}</Kv>
                {r?.total_pcs != null ? <Kv icon={<Box />} label="Unidades">{fmtNum(r.total_pcs)}{r.total_cbm != null ? ` · ${fmtNum(r.total_cbm, " m³")}` : ""}</Kv> : null}
              </dl>
              <dl className="ct-col ct-col-txt" role="cell" data-label="Material / Certificaciones / Reposición">
                <Kv icon={<Layers />} label="Material">{r?.material_measures || [p.materials, p.dimensions].filter(Boolean).join(" · ")}</Kv>
                <Kv icon={<Award />} label="Certificaciones">{r?.certifications}</Kv>
                <Kv icon={<RefreshCw />} label="Reposición">{r?.restock}</Kv>
              </dl>
              <div className="ct-actions" role="cell">
                <button className="btn btn-terra" onClick={() => open(p)}><Pencil />{fb || fi ? "Editar" : "Cargar"}</button>
                <Link className="btn ct-btn-inges" href={`/admin/contracara/planilla/${p.id}`}><FileSpreadsheet />INGES</Link>
                <button className="btn ct-btn-ph" onClick={() => setPhotos({ p, i: 0 })} disabled={!p.images.length}><Images />Ver fotos</button>
                {r?.photos_authorized ? <span className={`src-ph ph-${r.photos_authorized}`} title="Fotos autorizadas">Fotos: {PHOTOS[r.photos_authorized]}</span> : null}
              </div>
            </div>
          );
        })}
        {!list.length && <div className="ct-empty hint">No hay productos que coincidan.</div>}
      </div>

      {photos && (
        <div className="lens-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) setPhotos(null); }}>
          <div className="lens-modal ct-photos" role="dialog" aria-modal="true" aria-label={`Fotos de ${photos.p.name}`}>
            <div className="lens-head">
              <div><small className="mono">{photos.p.sku}</small><h3>{photos.p.name}</h3></div>
              <button className="icon-btn" aria-label="Cerrar" onClick={() => setPhotos(null)}><X /></button>
            </div>
            <div className="ct-ph-main">
              <ProductImage key={photos.i} p={photos.p} view={photos.i} sizes="720px" full hiRes />
              {photos.p.images.length > 1 && <>
                <button className="ct-ph-nav l" aria-label="Foto anterior" onClick={() => setPhotos((s) => s && { ...s, i: (s.i - 1 + s.p.images.length) % s.p.images.length })}><ChevronLeft /></button>
                <button className="ct-ph-nav r" aria-label="Foto siguiente" onClick={() => setPhotos((s) => s && { ...s, i: (s.i + 1) % s.p.images.length })}><ChevronRight /></button>
              </>}
            </div>
            {photos.p.images.length > 1 && (
              <div className="ct-ph-thumbs">
                {photos.p.images.map((_, i) => <button key={i} aria-current={i === photos.i} aria-label={`Foto ${i + 1}`} onClick={() => setPhotos({ ...photos, i })}><ProductImage p={photos.p} view={i} label={false} sizes="72px" /></button>)}
              </div>
            )}
            <p className="hint" style={{ marginTop: 10 }}>Fotos autorizadas por el proveedor: <b>{PHOTOS[rows.get(photos.p.id)?.photos_authorized ?? ""]}</b>{rows.get(photos.p.id)?.photos_note ? ` · ${rows.get(photos.p.id)!.photos_note}` : ""}. Las fotos se cambian desde la ficha del producto.</p>
          </div>
        </div>
      )}

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
              <label><span>Precio de compra (FOB)</span>
                <div className="src-money">
                  <select className="input" value={edit.v.currency} onChange={(e) => set("currency", e.target.value as SourcingValues["currency"])}>{Object.keys(CUR).map((c) => <option key={c}>{c}</option>)}</select>
                  <input className="input" inputMode="decimal" placeholder="0,00" value={edit.v.cost ?? ""} onChange={(e) => set("cost", (e.target.value as unknown) as number)} />
                </div>
              </label>
              <label><span>MOQ (pedido mínimo, unidades)</span><input className="input" inputMode="numeric" value={edit.v.moq ?? ""} onChange={(e) => set("moq", (e.target.value as unknown) as number)} /></label>
              <label><span>Plazo de producción</span><input className="input" placeholder="Ej.: 30 a 45 días" value={edit.v.lead_time} onChange={(e) => set("lead_time", e.target.value)} /></label>
              <h4 className="src-sec">Embalaje</h4>
              <label><span>Unidades por caja master</span><input className="input" inputMode="numeric" value={edit.v.units_per_box ?? ""} onChange={(e) => set("units_per_box", (e.target.value as unknown) as number)} /></label>
              <label><span>Volumen embalado (m³ por caja)</span><input className="input" inputMode="decimal" placeholder="Ej.: 0,085" value={edit.v.box_volume_m3 ?? ""} onChange={(e) => set("box_volume_m3", (e.target.value as unknown) as number)} /></label>
              <label><span>Peso embalado (kg por caja)</span><input className="input" inputMode="decimal" placeholder="Ej.: 12,5" value={edit.v.box_weight_kg ?? ""} onChange={(e) => set("box_weight_kg", (e.target.value as unknown) as number)} /></label>
              <label><span>Medidas de la caja (cm)</span><input className="input" placeholder="Ej.: 60 × 45 × 32 cm" value={edit.v.box_dimensions} onChange={(e) => set("box_dimensions", e.target.value)} /></label>
              <h4 className="src-sec">Producto</h4>
              <label className="wide"><span>Material y medidas</span><textarea className="input" rows={2} value={edit.v.material_measures} onChange={(e) => set("material_measures", e.target.value)} /></label>
              <label className="wide"><span>Certificaciones aplicables</span><textarea className="input" rows={2} placeholder="Ej.: FDA, LFGB, apto lavavajillas, ignífugo…" value={edit.v.certifications} onChange={(e) => set("certifications", e.target.value)} /></label>
              <label className="wide"><span>Opciones de reposición</span><textarea className="input" rows={2} placeholder="Ej.: stock permanente en depósito, a pedido con 60 días…" value={edit.v.restock} onChange={(e) => set("restock", e.target.value)} /></label>
              <label><span>Fotografías autorizadas</span>
                <select className="input" value={edit.v.photos_authorized} onChange={(e) => set("photos_authorized", e.target.value as SourcingValues["photos_authorized"])}>
                  <option value="">Sin dato</option><option value="si">Sí</option><option value="no">No</option><option value="consultar">A consultar</option>
                </select>
              </label>
              <label><span>Nota sobre las fotos</span><input className="input" placeholder="Ej.: solo con marca de agua" value={edit.v.photos_note} onChange={(e) => set("photos_note", e.target.value)} /></label>
              <label className="wide"><span>Notas internas</span><textarea className="input" rows={2} value={edit.v.notes} onChange={(e) => set("notes", e.target.value)} /></label>
              <p className="src-sec-note">Los datos de importación (origen, puerto, unidades, CBM, posición arancelaria…) se completan en la planilla INGES.</p>
            </div>
            {edit.error && <div className="adm-msg bad" style={{ marginTop: 10 }}>{edit.error}</div>}
            <div className="lens-actions">
              <button className="btn btn-ghost" disabled={edit.saving} onClick={() => setEdit(null)}>Cancelar</button>
              <button className="btn btn-ghost" disabled={edit.saving} onClick={() => save(true)}><FileSpreadsheet />Guardar y abrir planilla INGES</button>
              <button className="btn btn-dark" disabled={edit.saving} onClick={() => save()}>{edit.saving ? <Loader2 className="spin" /> : <Check />}Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
