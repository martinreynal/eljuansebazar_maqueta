"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { saveCustomWorks, saveDesign, saveFaqs } from "@/app/admin/actions";
import type { CustomWork, Design, Faq, Product } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";

type Msg = { ok: boolean; text: string } | null;
const swap = <T,>(a: T[], i: number, j: number) => { if (j < 0 || j >= a.length) return a; const c = [...a]; [c[i], c[j]] = [c[j], c[i]]; return c; };

function SaveBar({ pending, msg, label, onClick }: { pending: boolean; msg: Msg; label: string; onClick: () => void }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
      {msg && <span className={msg.ok ? "ok-msg" : "err"} role="status">{msg.text}</span>}
      <button className="btn btn-dark" onClick={onClick} disabled={pending}>{pending ? <Loader2 className="spin" /> : <Check />}{label}</button>
    </div>
  );
}

export function DesignEditor({ design, faqs, works, products }: { design: Design; faqs: Faq[]; works: CustomWork[]; products: Product[] }) {
  const router = useRouter();
  const [d, setD] = useState<Design>(design);
  const [fq, setFq] = useState(faqs.map((f) => ({ id: f.id as string | undefined, question: f.question, answer: f.answer })));
  const [wk, setWk] = useState(works.map((w) => ({ id: w.id as string | undefined, title: w.title, technique: w.technique, quantity: w.quantity, image_path: w.image_path, mock: !!w.placeholder && !w.image_path })));
  const [p1, s1] = useTransition(); const [m1, setM1] = useState<Msg>(null);
  const [p2, s2] = useTransition(); const [m2, setM2] = useState<Msg>(null);
  const [p3, s3] = useTransition(); const [m3, setM3] = useState<Msg>(null);
  const pub = products.filter((p) => p.visible && !p.archived);

  const T = (k: keyof Design, label: string, area = false, hint = "") => (
    <div className={`field ${area ? "full" : ""}`}>
      <label htmlFor={`d-${k}`}>{label}</label>
      {area ? <textarea className="input" id={`d-${k}`} rows={3} value={d[k] as string} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
        : <input className="input" id={`d-${k}`} value={d[k] as string} onChange={(e) => setD({ ...d, [k]: e.target.value })} />}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );

  return (
    <>
      <div className="adm-h"><div><h2>Diseño y textos</h2><p>Textos de la portada, preguntas frecuentes y trabajos con logo.</p></div><a className="btn btn-ghost" href="/" target="_blank">Ver portada</a></div>

      <div className="panel">
        <h3>Franja superior</h3>
        <div className="form-grid">{T("notice", "Aviso arriba de todo", true, "Dejalo vacío para ocultarlo. Útil para avisar envíos, feriados o que la web está en preparación.")}</div>
        <h3 style={{ marginTop: 18 }}>Banner principal</h3>
        <div className="form-grid">
          {T("heroEyebrow", "Antetítulo")}{T("heroCta", "Texto del botón")}
          {T("heroTitle", "Título", true)}{T("heroText", "Texto", true)}
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Fotos del banner (3 productos)</label>
          <div className="form-grid">
            {[0, 1, 2].map((i) => (
              <select key={i} className="input" value={d.heroProducts[i] ?? ""} aria-label={`Producto ${i + 1} del banner`} onChange={(e) => { const h = [...d.heroProducts]; h[i] = e.target.value; setD({ ...d, heroProducts: h.filter(Boolean) }); }}>
                <option value="">Automático</option>
                {pub.map((p) => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
              </select>
            ))}
          </div>
        </div>
        <h3 style={{ marginTop: 18 }}>Promoción</h3>
        <div className="form-grid">{T("promoTitle", "Título")}{T("promoText", "Texto", true, "Los productos de esta sección son los que tienen la etiqueta Oferta.")}</div>
        <h3 style={{ marginTop: 18 }}>Personalización con logo</h3>
        <div className="form-grid">{T("customEyebrow", "Antetítulo")}{T("customTitle", "Título")}{T("customText", "Texto", true)}</div>
        <h3 style={{ marginTop: 18 }}>Banner de WhatsApp</h3>
        <div className="form-grid">{T("waTitle", "Título")}{T("waText", "Texto", true)}</div>
        <SaveBar pending={p1} msg={m1} label="Guardar textos" onClick={() => s1(async () => { const r = await saveDesign(d); setM1(r.ok ? { ok: true, text: "Textos guardados." } : { ok: false, text: r.error }); router.refresh(); })} />
      </div>

      <div className="panel">
        <div className="adm-h" style={{ marginBottom: 6 }}><h3 style={{ margin: 0 }}>Trabajos con logo</h3><button className="btn btn-ghost btn-sm" disabled={wk.length >= 12} onClick={() => setWk([...wk, { id: undefined, title: "", technique: "", quantity: "", image_path: null, mock: false }])}><Plus />Agregar trabajo</button></div>
        <p className="hint" style={{ marginBottom: 8 }}>Se muestran los primeros 4 en la portada. Subí fotos de pedidos reales para reemplazar los mockups.</p>
        {wk.map((w, i) => (
          <div key={w.id ?? `n${i}`} className="faq-edit">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <div className="form-grid">
                <div className="field"><label htmlFor={`w-t-${i}`}>Marca o cliente</label><input className="input" id={`w-t-${i}`} value={w.title} onChange={(e) => setWk(wk.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></div>
                <div className="field"><label htmlFor={`w-q-${i}`}>Cantidad</label><input className="input" id={`w-q-${i}`} value={w.quantity} placeholder="Ej: 60 u." onChange={(e) => setWk(wk.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} /></div>
                <div className="field full"><label htmlFor={`w-k-${i}`}>Técnica</label><input className="input" id={`w-k-${i}`} value={w.technique} placeholder="Ej: Grabado láser" onChange={(e) => setWk(wk.map((x, j) => (j === i ? { ...x, technique: e.target.value } : x)))} /></div>
              </div>
              <ImageUploader value={w.image_path ? [w.image_path] : []} onChange={(v) => setWk(wk.map((x, j) => (j === i ? { ...x, image_path: v[0] ?? null } : x)))} folder="works" max={1} label={w.mock ? "Foto (ahora muestra un mockup)" : "Foto"} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button className="icon-btn" onClick={() => setWk(swap(wk, i, i - 1))} disabled={i === 0} aria-label="Subir"><ChevronUp /></button>
              <button className="icon-btn" onClick={() => setWk(swap(wk, i, i + 1))} disabled={i === wk.length - 1} aria-label="Bajar"><ChevronDown /></button>
              <button className="icon-btn" style={{ color: "var(--bad)" }} onClick={() => setWk(wk.filter((_, j) => j !== i))} aria-label="Quitar trabajo"><Trash2 /></button>
            </div>
          </div>
        ))}
        <SaveBar pending={p3} msg={m3} label="Guardar trabajos" onClick={() => s3(async () => { const r = await saveCustomWorks(wk.map(({ mock: _m, ...w }) => w)); setM3(r.ok ? { ok: true, text: "Trabajos guardados." } : { ok: false, text: r.error }); router.refresh(); })} />
      </div>

      <div className="panel">
        <div className="adm-h" style={{ marginBottom: 6 }}><h3 style={{ margin: 0 }}>Preguntas frecuentes</h3><button className="btn btn-ghost btn-sm" onClick={() => setFq([...fq, { id: undefined, question: "", answer: "" }])}><Plus />Agregar pregunta</button></div>
        {fq.map((f, i) => (
          <div key={f.id ?? `n${i}`} className="faq-edit">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <div className="field"><label htmlFor={`fq-${i}`}>Pregunta {i + 1}</label><input className="input" id={`fq-${i}`} value={f.question} onChange={(e) => setFq(fq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} /></div>
              <div className="field"><label htmlFor={`fa-${i}`}>Respuesta</label><textarea className="input" id={`fa-${i}`} rows={3} value={f.answer} onChange={(e) => setFq(fq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} /></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button className="icon-btn" onClick={() => setFq(swap(fq, i, i - 1))} disabled={i === 0} aria-label="Subir pregunta"><ChevronUp /></button>
              <button className="icon-btn" onClick={() => setFq(swap(fq, i, i + 1))} disabled={i === fq.length - 1} aria-label="Bajar pregunta"><ChevronDown /></button>
              <button className="icon-btn" style={{ color: "var(--bad)" }} onClick={() => setFq(fq.filter((_, j) => j !== i))} aria-label="Eliminar pregunta"><Trash2 /></button>
            </div>
          </div>
        ))}
        <SaveBar pending={p2} msg={m2} label="Guardar preguntas" onClick={() => s2(async () => { const r = await saveFaqs(fq); setM2(r.ok ? { ok: true, text: "Preguntas guardadas." } : { ok: false, text: r.error }); router.refresh(); })} />
      </div>
    </>
  );
}
