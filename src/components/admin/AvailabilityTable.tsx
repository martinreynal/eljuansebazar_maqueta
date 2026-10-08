"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateProductFlags } from "@/app/admin/actions";
import { AVAILABILITY } from "@/lib/format";
import type { Availability, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

export function AvailabilityTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (id: string, patch: Parameters<typeof updateProductFlags>[1], text: string) =>
    start(async () => {
      const r = await updateProductFlags(id, patch);
      setMsg(r.ok ? { ok: true, text } : { ok: false, text: r.error });
      router.refresh();
    });
  return (
    <>
      <div className="adm-h"><div><h2>Disponibilidad</h2><p>Marcá el estado de cada producto. “Discontinuado” lo oculta de la tienda sin borrarlo.</p></div></div>
      {msg && <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} role="status">{msg.text}</div>}
      <div className="tbl-wrap" aria-busy={pending}>
        <table className="tbl">
          <thead><tr><th>Producto</th><th>Estado</th><th className="num">Stock (opcional)</th></tr></thead>
          <tbody>
            {products.filter((p) => !p.archived).map((p) => (
              <tr key={p.id}>
                <td><div className="pt"><span className="t"><ProductImage p={p} view={1} label={false} sizes="42px" /></span><span>{p.name} <span className="mono" style={{ color: "var(--muted)" }}>{p.sku}</span></span></div></td>
                <td>
                  <div className="seg" role="group" aria-label={`Estado de ${p.name}`}>
                    {(Object.keys(AVAILABILITY) as Availability[]).map((a) => (
                      <button key={a} aria-pressed={p.availability === a} onClick={() => p.availability !== a && run(p.id, { availability: a }, `${p.name}: ${AVAILABILITY[a]}.`)}>{AVAILABILITY[a]}</button>
                    ))}
                  </div>
                </td>
                <td className="num">
                  <input
                    className="input" style={{ width: 90, height: 36, textAlign: "right" }} inputMode="numeric" defaultValue={p.stock ?? ""} aria-label={`Stock de ${p.name}`}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      const n = v === "" ? null : Number(v);
                      if (n !== null && (!Number.isInteger(n) || n < 0)) { setMsg({ ok: false, text: "El stock tiene que ser un número entero, 0 o mayor." }); e.target.value = p.stock == null ? "" : String(p.stock); return; }
                      if (n !== p.stock) run(p.id, { stock: n }, `Stock de ${p.name} actualizado.`);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
