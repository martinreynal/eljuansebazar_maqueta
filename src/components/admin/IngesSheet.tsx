"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowLeft, Calculator, Check, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Save } from "lucide-react";
import { saveSourcing, type SourcingInput } from "@/app/admin/actions";
import { CUR, INGES_FIELDS, calcCartons, calcCbm, countFilled, toNum, valuesOf, type SourcingRow, type SourcingValues } from "@/lib/sourcing";
import type { Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

type Nav = { id: string; sku: string } | null;
/** Números con formato local para leerlos cómodos en los campos (10.000 · 0,085 · 1,25); al guardar se vuelven a interpretar. */
const NUM_KEYS: (keyof SourcingValues)[] = ["cost", "moq", "units_per_box", "box_volume_m3", "box_weight_kg", "total_pcs", "total_cartons", "total_cbm", "fob_djai", "net_weight_g"];
const forInputs = (x: SourcingValues): SourcingValues => {
  const o = { ...x } as Record<string, unknown>;
  for (const k of NUM_KEYS) if (typeof o[k] === "number") o[k] = (o[k] as number).toLocaleString("es-AR", { maximumFractionDigits: 6 });
  return o as SourcingValues;
};
const ORIGINS = ["China", "India", "Vietnam", "Turquía", "Italia", "Portugal", "España", "Brasil", "Argentina"];

/** Fila de la planilla: rótulo bilingüe a la izquierda, dato a la derecha (como en el Excel del despachante). */
function Row({ label, en, children, shared, hint }: { label: string; en?: string; children: React.ReactNode; shared?: boolean; hint?: React.ReactNode }) {
  return (
    <div className="ig-row">
      <div className="ig-lbl">
        <span>{label}</span>
        {en && <small>{en}</small>}
        {shared && <em title="Este dato es el mismo de la contracara: si lo cambiás acá, cambia allá también.">Contracara</em>}
      </div>
      <div className="ig-val">{children}{hint && <div className="ig-hint">{hint}</div>}</div>
    </div>
  );
}

/**
 * Planilla de clasificación INGES editable en el panel. Replica el Excel que pide el despachante
 * (clasificación arancelaria + costeo de previsión + foto) y se exporta a ese mismo Excel completado.
 */
export function IngesSheet({ p, catName, row, prev, next, pos, total }: { p: Product; catName: string; row: SourcingRow | null; prev: Nav; next: Nav; pos: number; total: number }) {
  const router = useRouter();
  const [v, setV] = useState<SourcingValues>(() => {
    const x = forInputs(valuesOf(row));
    if (!x.customs_name) x.customs_name = p.name;
    if (!x.customs_description) x.customs_description = p.description ?? "";
    return x;
  });
  const [dirty, setDirty] = useState(false);
  const [saving, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [foto, setFoto] = useState(0);
  const set = <K extends keyof SourcingValues>(k: K, val: SourcingValues[K]) => { setV((s) => ({ ...s, [k]: val })); setDirty(true); setMsg(null); };
  const num = (k: keyof SourcingValues) => (v[k] ?? "") as string | number;
  const filled = countFilled(v, INGES_FIELDS);
  const cartons = calcCartons(v), cbm = calcCbm(v);

  const save = useCallback((after?: () => void) =>
    start(async () => {
      const r = await saveSourcing({ product_id: p.id, ...v } as SourcingInput);
      if (!r.ok) { setMsg({ ok: false, t: r.error }); return; }
      if (r.data?.row) setV(forInputs(valuesOf(r.data.row)));
      setDirty(false);
      setMsg({ ok: true, t: "Planilla guardada." });
      after?.();
    }), [p.id, v]);
  const go = (href: string) => (dirty ? save(() => router.push(href)) : router.push(href));
  const exportXlsx = () => {
    const href = `/admin/contracara/inges/${p.id}?foto=${foto}`;
    if (dirty) save(() => { window.location.href = href; });
    else window.location.href = href;
  };

  // Ctrl/Cmd + S guarda; aviso al salir con cambios sin guardar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { document.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [dirty, save]);

  const txt = (k: keyof SourcingValues, ph = "", rows = 0) => rows
    ? <textarea className="ig-in" rows={rows} placeholder={ph} value={String(v[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
    : <input className="ig-in" placeholder={ph} value={String(v[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />;
  const numIn = (k: keyof SourcingValues, ph = "", mode: "numeric" | "decimal" = "numeric") =>
    <input className="ig-in ig-num" inputMode={mode} placeholder={ph} value={num(k)} onChange={(e) => set(k, e.target.value as never)} />;

  return (
    <div className="ig">
      <div className="ig-bar">
        <Link href="/admin/contracara" className="ig-back" onClick={(e) => { if (dirty) { e.preventDefault(); go("/admin/contracara"); } }}><ArrowLeft />Contracara</Link>
        <div className="ig-prod">
          <span className="ig-thumb"><ProductImage p={p} label={false} sizes="48px" /></span>
          <div><b>{p.name}</b><small><span className="mono">{p.sku}</span>{catName ? ` · ${catName}` : ""}{v.supplier ? ` · ${v.supplier}` : ""}</small></div>
        </div>
        <div className="ig-nav">
          <button className="icon-btn" disabled={!prev || saving} onClick={() => prev && go(`/admin/contracara/planilla/${prev.id}`)} aria-label={prev ? `Anterior: ${prev.sku}` : "Anterior"} title={prev?.sku}><ChevronLeft /></button>
          <span>{pos} de {total}</span>
          <button className="icon-btn" disabled={!next || saving} onClick={() => next && go(`/admin/contracara/planilla/${next.id}`)} aria-label={next ? `Siguiente: ${next.sku}` : "Siguiente"} title={next?.sku}><ChevronRight /></button>
        </div>
        <div className="ig-acts">
          <span className={`ig-state ${dirty ? "dirty" : ""}`} role="status">{saving ? "Guardando…" : dirty ? "Cambios sin guardar" : msg?.ok ? "Guardado" : `${filled} de ${INGES_FIELDS.length} datos`}</span>
          <button className="btn btn-dark" onClick={() => save()} disabled={saving || !dirty}>{saving ? <Loader2 className="spin" /> : <Save />}Guardar</button>
          <button className="btn btn-terra" onClick={exportXlsx} disabled={saving}><FileSpreadsheet />Exportar a Excel</button>
        </div>
      </div>
      {msg && !msg.ok && <div className="adm-msg bad" style={{ marginBottom: 12 }}>{msg.t}</div>}

      <div className="ig-order">
        <label htmlFor="ig-order">Orden de clasificación</label>
        <input id="ig-order" className="ig-in" placeholder="Número de orden" value={v.inges_order} onChange={(e) => set("inges_order", e.target.value)} />
        <div className="ig-prog" title={`${filled} de ${INGES_FIELDS.length} datos de la planilla`}><i style={{ width: `${(filled / INGES_FIELDS.length) * 100}%` }} /></div>
      </div>

      <div className="ig-sheet">
        <section className="ig-card ig-clas" aria-labelledby="ig-h1">
          <h3 id="ig-h1" className="ig-h">Datos de clasificación arancelaria</h3>
          <div className="ig-block">
            <div className="ig-side"><span>1) Completar por solicitante</span></div>
            <div className="ig-rows">
              <Row label="Nombre producto" en="Product name">{txt("customs_name", "Nombre en español / inglés", 2)}</Row>
              <Row label="Descripción producto" en="Product description">{txt("customs_description", "Qué es, para qué se usa, cómo está hecho", 4)}</Row>
              <Row label="Origen" en="Origin">
                <input className="ig-in" list="ig-origins" placeholder="País de origen" value={v.origin} onChange={(e) => set("origin", e.target.value)} />
                <datalist id="ig-origins">{ORIGINS.map((o) => <option key={o} value={o} />)}</datalist>
              </Row>
              <Row label="Detalle de funcionamiento" en="Operating details">{txt("operating_details", "Solo si corresponde (productos con mecanismo o eléctricos)", 2)}</Row>
              <Row label="Material constitutivo (%)" en="Material composition (%)">{txt("material_composition", "Ej.: Cerámica 100% · Acero inoxidable 90%, madera 10%")}</Row>
              <Row label="Muestra" en="Sample">{txt("sample", "Ej.: Sí, enviada el 10/12")}</Row>
              <Row label="Observaciones" en="Notes">{txt("customs_notes", "", 2)}</Row>
            </div>
          </div>
          <div className="ig-block ig-photos">
            <div className="ig-side"><span>2) Fotos de producto a posicionar</span></div>
            <div className="ig-ph">
              {p.images.length ? (
                <>
                  <div className="ig-ph-main"><ProductImage key={foto} p={p} view={foto} sizes="360px" full /></div>
                  {p.images.length > 1 && (
                    <div className="ig-ph-thumbs" role="radiogroup" aria-label="Foto que va en la planilla">
                      {p.images.map((_, i) => <button key={i} role="radio" aria-checked={foto === i} aria-label={`Foto ${i + 1}`} onClick={() => setFoto(i)}><ProductImage p={p} view={i} label={false} sizes="64px" /></button>)}
                    </div>
                  )}
                  <p className="ig-hint">Esta foto va pegada en el Excel. {p.images.length > 1 ? "Elegí otra tocando las miniaturas." : ""}</p>
                </>
              ) : <p className="ig-hint">El producto no tiene fotos. Cargalas desde su ficha para que salgan en la planilla.</p>}
            </div>
          </div>
        </section>

        <div className="ig-right">
          <section className="ig-card ig-cost" aria-labelledby="ig-h2">
            <h3 id="ig-h2" className="ig-h">Datos requeridos para costeo previsión</h3>
            <div className="ig-rows">
              <Row label="Unidades totales" en="Total pieces">{numIn("total_pcs", "Ej.: 10.000")}</Row>
              <Row label="Unidades por caja master" en="PCS/CTN" shared>{numIn("units_per_box", "Ej.: 24")}</Row>
              <Row label="Total caja master" en="Total master carton"
                hint={cartons != null && cartons !== toNum(v.total_cartons) ? <button className="ig-calc" onClick={() => set("total_cartons", cartons.toLocaleString("es-AR") as never)}><Calculator />Usar cálculo: {cartons.toLocaleString("es-AR")} cajas</button> : null}>
                {numIn("total_cartons", cartons != null ? cartons.toLocaleString("es-AR") : "Unidades ÷ unidades por caja")}
              </Row>
              <Row label="Medidas caja master (cm)" en="Master carton measures" shared>{txt("box_dimensions", "Ej.: 60 × 45 × 32")}</Row>
              <Row label="Volumen por caja (m³)" en="Para calcular el CBM" shared>{numIn("box_volume_m3", "Ej.: 0,085", "decimal")}</Row>
              <Row label="Total CBM" en="m³"
                hint={cbm != null && cbm !== toNum(v.total_cbm) ? <button className="ig-calc" onClick={() => set("total_cbm", cbm.toLocaleString("es-AR", { maximumFractionDigits: 6 }) as never)}><Calculator />Usar cálculo: {cbm.toLocaleString("es-AR")} m³</button> : null}>
                {numIn("total_cbm", cbm != null ? cbm.toLocaleString("es-AR") : "Cajas × volumen por caja", "decimal")}
              </Row>
              <Row label="FOB real" en="FOB price" shared>
                <div className="ig-money">
                  <select className="ig-in" value={v.currency} onChange={(e) => set("currency", e.target.value as SourcingValues["currency"])} aria-label="Moneda">{Object.keys(CUR).map((c) => <option key={c}>{c}</option>)}</select>
                  {numIn("cost", "0,00", "decimal")}
                </div>
              </Row>
              <Row label="FOB DJAI">{numIn("fob_djai", "0,00", "decimal")}</Row>
              <Row label="Peso neto por unidad (g)" en="Net weight per pcs">{numIn("net_weight_g", "Ej.: 820", "decimal")}</Row>
              <Row label="Tipo de embarque" en="Aéreo o marítimo">
                <div className="ig-seg" role="radiogroup" aria-label="Tipo de embarque">
                  {([["maritimo", "Marítimo"], ["aereo", "Aéreo"]] as const).map(([k, t]) => <button key={k} role="radio" aria-checked={v.shipping_mode === k} onClick={() => set("shipping_mode", v.shipping_mode === k ? "" : k)}>{t}</button>)}
                </div>
              </Row>
              <Row label="Puerto de embarque" en="Port of loading">{txt("loading_port", "Ej.: Guangzhou, China")}</Row>
              <Row label="Tiempo de producción" en="Production time" shared>{txt("lead_time", "Ej.: 35–50 días")}</Row>
            </div>
          </section>

          <section className="ig-card ig-result" aria-labelledby="ig-h3">
            <h3 id="ig-h3" className="ig-h">Resultado de la clasificación</h3>
            <div className="ig-rows">
              <Row label="Posición arancelaria" en="HS code">{txt("hs_code", "Ej.: 6911.10.19.00")}</Row>
            </div>
            <p className="ig-foot"><Check /><span>Los datos marcados <em>Contracara</em> son los mismos de la contracara del producto: se actualizan en los dos lugares.</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
