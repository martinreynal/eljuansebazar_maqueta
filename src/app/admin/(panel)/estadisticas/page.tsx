import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminData } from "@/lib/admin-data";

type Ev = { type: string; channel: string | null; product_id: string | null; category_id: string | null; created_at: string };
const RANGES = { "7": "7 días", "30": "30 días", "90": "90 días" } as const;

function Bars({ rows, alt }: { rows: [string, number][]; alt?: boolean }) {
  if (!rows.length) return <p className="hint">Todavía no hay datos en este período.</p>;
  const m = Math.max(...rows.map((r) => r[1]), 1);
  return (
    <div className="bars">
      {rows.map(([k, v]) => (
        <div key={k} className={`bar ${alt ? "alt" : ""}`}><span title={k}>{k}</span><i style={{ width: `${(v / m) * 100}%` }} /><b>{v}</b></div>
      ))}
    </div>
  );
}

export default async function StatsAdmin({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias } = await searchParams;
  const days = dias && dias in RANGES ? Number(dias) : 30;
  const sb = await requireAdmin();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { data, error } = await sb.from("events").select("type, channel, product_id, category_id, created_at").gte("created_at", since).limit(50000);
  const { products, categories } = await adminData();
  const ev = (data ?? []) as Ev[];
  const name = new Map(products.map((p) => [p.id, p.name]));
  const cname = new Map(categories.map((c) => [c.id, c.name]));
  const count = (f: (e: Ev) => boolean, key: (e: Ev) => string | null) => {
    const m = new Map<string, number>();
    for (const e of ev) if (f(e)) { const k = key(e); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  };
  const views = ev.filter((e) => e.type === "product_view").length;
  const wa = ev.filter((e) => e.type === "wa_click").length;
  const lists = ev.filter((e) => e.type === "list_send").length;
  const CH: Record<string, string> = { product: "Producto individual", list: "Lista de consulta", general: "Botón general", custom: "Personalizados", quote: "Cotización general" };

  return (
    <>
      <div className="adm-h">
        <div><h2>Estadísticas</h2><p>Interacciones anónimas, sin datos personales. Un clic en WhatsApp es una consulta iniciada, no una venta confirmada.</p></div>
        <div className="seg" role="group" aria-label="Período">
          {Object.entries(RANGES).map(([k, v]) => <Link key={k} href={`/admin/estadisticas?dias=${k}`} aria-pressed={days === Number(k)} className="seg-link">{v}</Link>)}
        </div>
      </div>
      {error && <div className="adm-msg bad">No se pudieron leer las estadísticas: {error.message}</div>}
      <div className="kpis">
        <div className="kpi"><small>Visitas a productos</small><b>{views}</b></div>
        <div className="kpi"><small>Clics en WhatsApp</small><b>{wa}</b></div>
        <div className="kpi"><small>Listas enviadas</small><b>{lists}</b></div>
        <div className="kpi"><small>Categorías exploradas</small><b>{new Set(ev.filter((e) => e.type === "category_view").map((e) => e.category_id)).size}</b></div>
      </div>
      <div className="two">
        <div className="panel"><h3>Productos más vistos</h3><Bars rows={count((e) => e.type === "product_view", (e) => name.get(e.product_id ?? "") ?? null)} /></div>
        <div className="panel"><h3>Productos más consultados</h3><Bars alt rows={count((e) => e.type === "wa_click" && e.channel === "product", (e) => name.get(e.product_id ?? "") ?? null)} /></div>
        <div className="panel"><h3>Categorías más exploradas</h3><Bars rows={count((e) => e.type === "category_view", (e) => cname.get(e.category_id ?? "") ?? null)} /></div>
        <div className="panel"><h3>Consultas por canal</h3><Bars alt rows={count((e) => e.type === "wa_click", (e) => CH[e.channel ?? ""] ?? null)} /></div>
      </div>
    </>
  );
}
