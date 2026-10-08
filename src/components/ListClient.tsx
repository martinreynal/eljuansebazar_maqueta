"use client";
import Link from "next/link";
import { useState } from "react";
import { ClipboardList, Copy, Minus, Plus, Trash2 } from "lucide-react";
import { AVAILABILITY, formatPhone, money, msgList, priceShown, waLink } from "@/lib/format";
import { track } from "@/lib/track";
import type { Product, Settings } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";

export function ListClient({ products, settings, base }: { products: Product[]; settings: Settings; base: string }) {
  const { list, ready, setQty, removeFromList, clearList, toast } = useStore();
  const [confirm, setConfirm] = useState(false);
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

  const msg = msgList(base, items, bySku);
  const units = items.reduce((a, i) => a + i.qty, 0);
  const est = items.reduce((a, i) => { const p = bySku.get(i.sku)!; return a + (priceShown(p, settings) ? p.price! * i.qty : 0); }, 0);

  const copy = async () => {
    try { await navigator.clipboard.writeText(msg); toast("Mensaje copiado"); }
    catch { toast("No se pudo copiar. Seleccioná el texto y copialo a mano."); }
  };

  return (
    <div className="list-layout">
      <div>
        <p className="hint" style={{ marginBottom: 6 }}>La lista se guarda en este navegador. No es una compra: sirve para pedir una cotización de todo junto por WhatsApp.</p>
        {missing > 0 && <p className="hint">{missing} producto{missing === 1 ? "" : "s"} de tu lista ya no está{missing === 1 ? "" : "n"} disponible{missing === 1 ? "" : "s"} y no se incluye{missing === 1 ? "" : "n"} en el mensaje.</p>}
        {items.map((i) => {
          const p = bySku.get(i.sku)!;
          return (
            <div className="li" key={`${i.sku}|${i.variant}`}>
              <Link className="t" href={`/producto/${p.slug}`}><ProductImage p={p} view={1} label={false} sizes="88px" /></Link>
              <div style={{ minWidth: 0 }}>
                <h3><Link href={`/producto/${p.slug}`}>{p.name}</Link></h3>
                <div className="sub"><span className="mono">Código {p.sku}</span>{i.variant && <span>{i.variant}</span>}{priceShown(p, settings) && <span>{money(p.price!)} c/u</span>}</div>
                <div style={{ marginTop: 6 }}><span className={`avail ${p.availability === "sin_stock" ? "sin-stock" : p.availability}`}><i className="dot" />{AVAILABILITY[p.availability]}</span></div>
              </div>
              <div className="ctrl">
                <div className="stepper sm" aria-label={`Cantidad de ${p.name}`}>
                  <button onClick={() => setQty(i.sku, i.variant, i.qty - 1)} aria-label="Restar uno"><Minus /></button>
                  <output>{i.qty}</output>
                  <button onClick={() => setQty(i.sku, i.variant, i.qty + 1)} aria-label="Sumar uno"><Plus /></button>
                </div>
                <button className="link-btn" style={{ fontSize: 13 }} onClick={() => { removeFromList(i.sku, i.variant); toast("Producto quitado de la lista"); }}>Quitar</button>
              </div>
            </div>
          );
        })}
      </div>
      <aside className="summary" aria-label="Resumen de la consulta">
        <h3>Resumen</h3>
        <div className="sum-row"><span>Productos</span><b>{items.length}</b></div>
        <div className="sum-row"><span>Unidades</span><b>{units}</b></div>
        {est > 0 && <><div className="sum-row"><span>Referencia</span><b>{money(est)}</b></div><p className="hint" style={{ marginTop: -8 }}>Valor orientativo. El precio final se confirma por WhatsApp.</p></>}
        <div><span className="opt-label">Mensaje que se va a enviar</span><div className="msg">{msg}</div></div>
        <WaLink href={waLink(settings.whatsapp, msg)} channel="list" className="btn btn-wa btn-lg btn-block" onSent={() => track("list_send")}>Pedir cotización de la lista</WaLink>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={copy}><Copy />Copiar mensaje</button>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setConfirm(true)}><Trash2 />Vaciar lista</button>
        </div>
        {confirm && (
          <div className="confirm" role="alertdialog" aria-label="Confirmar vaciado">
            <span>¿Querés quitar todos los productos de la lista?</span>
            <div><button className="btn btn-dark btn-sm" onClick={() => { clearList(); setConfirm(false); }}>Sí, vaciar</button><button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Cancelar</button></div>
          </div>
        )}
        <p className="hint">Se abre WhatsApp con el número <span className="mono">{formatPhone(settings.whatsapp)}</span>.</p>
      </aside>
    </div>
  );
}
