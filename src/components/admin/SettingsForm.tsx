"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveSettings } from "@/app/admin/actions";
import { formatPhone, waLink } from "@/lib/format";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [s, setS] = useState({ ...settings });
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string; field?: string } | null>(null);
  const F = (k: "business_name" | "tagline" | "whatsapp" | "hours" | "instagram" | "facebook" | "site_url", label: string, hint = "") => (
    <div className="field">
      <label htmlFor={`s-${k}`}>{label}</label>
      <input className={`input${msg?.field === k ? " invalid" : ""}`} id={`s-${k}`} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      {hint && <span className="hint">{hint}</span>}
      {msg?.field === k && <span className="err">{msg.text}</span>}
    </div>
  );
  const save = () => start(async () => {
    const { design: _d, ...rest } = s;
    const r = await saveSettings(rest);
    setMsg(r.ok ? { ok: true, text: "Configuración guardada." } : { ok: false, text: r.error, field: r.field });
    router.refresh();
  });
  return (
    <>
      <div className="adm-h"><div><h2>Configuración</h2><p>Datos del negocio que aparecen en la tienda y en los mensajes de WhatsApp.</p></div></div>
      <div className="panel"><h3>Negocio</h3><div className="form-grid">{F("business_name", "Nombre del negocio")}{F("tagline", "Frase debajo del logo")}{F("hours", "Horarios de atención")}{F("site_url", "Dirección del sitio", "Ej: https://eljuansebazar.com.ar. Se usa en los links de los productos que van en los mensajes.")}</div></div>
      <div className="panel">
        <h3>WhatsApp comercial</h3>
        <div className="form-grid">{F("whatsapp", "Número con código de país", "Sin espacios ni signos: 549 + código de área + número.")}</div>
        <p className="hint" style={{ marginTop: 8 }}>Se va a mostrar como <span className="mono">{formatPhone(s.whatsapp)}</span>. <a className="link-btn" href={waLink(s.whatsapp, "Prueba desde el panel de la web")} target="_blank" rel="noopener noreferrer">Probar el número</a></p>
      </div>
      <div className="panel"><h3>Redes sociales</h3><div className="form-grid">{F("instagram", "Instagram")}{F("facebook", "Facebook")}</div></div>
      <div className="panel">
        <h3>Precios</h3>
        <div className="row-inline">
          <div><b>Mostrar precios en la tienda</b><p className="hint">Apagado: todo se maneja por cotización y no aparecen precios ni filtros por precio.</p></div>
          <label className="switch"><input type="checkbox" checked={s.show_prices} onChange={(e) => setS({ ...s, show_prices: e.target.checked })} aria-label="Mostrar precios" /><span /></label>
        </div>
      </div>
      <div className="sticky-save">
        {msg && !msg.field && <span className={msg.ok ? "ok-msg" : "err"} style={{ marginRight: "auto" }} role="status">{msg.text}</span>}
        <button className="btn btn-dark" onClick={save} disabled={pending}>{pending ? <Loader2 className="spin" /> : <Check />}Guardar configuración</button>
      </div>
    </>
  );
}
