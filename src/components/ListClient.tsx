"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ClipboardList, Copy, MessageSquareText, Minus, Plus, Trash2, X } from "lucide-react";
import { AVAILABILITY, formatPhone, msgList, plural, waLink, type ListItem } from "@/lib/format";
import { track } from "@/lib/track";
import type { Product, Settings } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";

/** Campo de cantidad: se puede escribir el número o usar los botones. */
function QtyInput({ value, onChange, name }: { value: number; onChange: (n: number) => void; name: string }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 1) onChange(n);
    else setDraft(String(value));
  };
  return (
    <div className="qty" role="group" aria-label={`Cantidad de ${name}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Restar uno"><Minus /></button>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Cantidad"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= 999} aria-label="Sumar uno"><Plus /></button>
    </div>
  );
}

function Row({ i, p, index }: { i: ListItem; p: Product; index: number }) {
  const { setQty, removeFromList, restoreItem, setNote, toast } = useStore();
  const [open, setOpen] = useState(!!i.note);
  const remove = () => {
    removeFromList(i.sku, i.variant);
    toast(`Quitaste ${p.sku}`, undefined, ["Deshacer", () => restoreItem(i, index)]);
  };
  return (
    <li className="lr">
      <Link className="lr-img" href={`/producto/${p.slug}`} tabIndex={-1} aria-hidden>
        <ProductImage p={p} view={1} label={false} sizes="96px" />
      </Link>
      <div className="lr-info">
        <div className="lr-meta">
          <span className="pc-sku">{p.sku}</span>
          {p.availability === "sin_stock" && <span className="lr-warn">{AVAILABILITY[p.availability]}</span>}
        </div>
        <h3 className="lr-name"><Link href={`/producto/${p.slug}`}>{p.name}</Link></h3>
        {i.variant && <p className="lr-var">{i.variant}</p>}
        {open ? (
          <div className="lr-note">
            <textarea
              className="input"
              rows={2}
              maxLength={200}
              placeholder="Ej: color, medida, con logo, para cuándo lo necesitás…"
              aria-label={`Observación para ${p.name}`}
              value={i.note ?? ""}
              onChange={(e) => setNote(i.sku, i.variant, e.target.value)}
              autoFocus={!i.note}
            />
            <button type="button" className="lr-note-x" aria-label="Quitar observación" onClick={() => { setNote(i.sku, i.variant, ""); setOpen(false); }}><X /></button>
          </div>
        ) : (
          <button type="button" className="lr-add-note" onClick={() => setOpen(true)}><MessageSquareText />Agregar observación</button>
        )}
      </div>
      <div className="lr-ctrl">
        <QtyInput value={i.qty} name={p.name} onChange={(n) => setQty(i.sku, i.variant, n)} />
        <button type="button" className="lr-del" onClick={remove} aria-label={`Eliminar ${p.name} de la lista`} title="Eliminar"><Trash2 /></button>
      </div>
    </li>
  );
}

export function ListClient({ products, settings, base }: { products: Product[]; settings: Settings; base: string }) {
  const { list, ready, clearList, listNote, setListNote, toast } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState(false);
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const items = list.filter((i) => bySku.has(i.sku));
  const missing = list.length - items.length;

  if (!ready) return <div className="sk" style={{ height: 240 }} aria-busy="true" />;
  if (!items.length)
    return (
      <div className="empty">
        <div className="ic"><ClipboardList /></div>
        <h3>Tu lista está vacía</h3>
        <p>Agregá productos con el botón de lista y después mandanos todo junto en un solo mensaje de WhatsApp. No hace falta registrarse.</p>
        <Link className="btn btn-dark" href="/catalogo">Explorar el catálogo</Link>
      </div>
    );

  const msg = msgList(base, items, bySku, listNote);
  const href = waLink(settings.whatsapp, msg);
  const units = items.reduce((a, i) => a + i.qty, 0);

  const copy = async () => {
    try { await navigator.clipboard.writeText(msg); toast("Mensaje copiado"); }
    catch { toast("No se pudo copiar. Seleccioná el texto y copialo a mano."); }
  };

  return (
    <>
      <div className="list-layout">
        <section aria-label="Productos de la lista">
          <div className="lc-bar">
            <p className="lc-count" aria-live="polite"><b>{items.length}</b> {items.length === 1 ? "producto seleccionado" : "productos seleccionados"}<span>{plural(units, "unidad", "unidades")} en total</span></p>
            {confirm ? (
              <div className="lc-confirm" role="alertdialog" aria-label="Confirmar vaciado">
                <span>¿Vaciar la lista?</span>
                <button className="btn btn-dark btn-sm" onClick={() => { clearList(); setConfirm(false); }}>Sí, vaciar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>No</button>
              </div>
            ) : (
              <button className="link-btn lc-clear" onClick={() => setConfirm(true)}><Trash2 />Vaciar lista</button>
            )}
          </div>
          {missing > 0 && <p className="hint">{plural(missing, "producto", "productos")} de tu lista ya no {missing === 1 ? "está" : "están"} en el catálogo y no se {missing === 1 ? "incluye" : "incluyen"} en el mensaje.</p>}
          <ul className="lc-list">
            {items.map((i) => <Row key={`${i.sku}|${i.variant}`} i={i} p={bySku.get(i.sku)!} index={list.indexOf(i)} />)}
          </ul>
          <Link className="link-btn lc-more" href="/catalogo"><Plus />Agregar más productos</Link>
        </section>

        <aside className="summary" aria-label="Resumen de la consulta">
          <h3>Tu consulta</h3>
          <div className="sum-stats">
            <div><b>{items.length}</b><span>{items.length === 1 ? "producto" : "productos"}</span></div>
            <div><b>{units}</b><span>{units === 1 ? "unidad" : "unidades"}</span></div>
          </div>
          <div className="field">
            <label htmlFor="list-note">Observaciones generales <span className="opt">(opcional)</span></label>
            <textarea
              id="list-note"
              className="input"
              rows={3}
              maxLength={600}
              placeholder="Ej: lo necesito para un restaurante, con logo, zona de entrega, fecha…"
              value={listNote}
              onChange={(e) => setListNote(e.target.value)}
            />
          </div>
          <WaLink href={href} channel="list" className="btn btn-wa btn-lg btn-block" onSent={() => track("list_send")}>Enviar consulta por WhatsApp</WaLink>
          <div className="sum-msg">
            <button type="button" className="sum-msg-toggle" aria-expanded={preview} onClick={() => setPreview((v) => !v)}>
              Ver mensaje que se envía <ChevronDown />
            </button>
            {preview && (
              <>
                <div className="msg">{msg}</div>
                <button className="btn btn-ghost btn-sm" onClick={copy}><Copy />Copiar mensaje</button>
              </>
            )}
          </div>
          <p className="hint">No es una compra: te respondemos por WhatsApp al <span className="mono">{formatPhone(settings.whatsapp)}</span> con precio y disponibilidad. La lista queda guardada en este navegador.</p>
        </aside>
      </div>

      <div className="lc-sticky">
        <div><b>{items.length} {items.length === 1 ? "producto" : "productos"}</b><span>{plural(units, "unidad", "unidades")}</span></div>
        <WaLink href={href} channel="list" className="btn btn-wa" onSent={() => track("list_send")}>Enviar consulta</WaLink>
      </div>
    </>
  );
}
