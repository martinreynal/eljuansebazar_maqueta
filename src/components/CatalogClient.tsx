"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FileDown, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { AVAILABILITY, inCategory, money, priceShown, searchable, waLink } from "@/lib/format";
import { track } from "@/lib/track";
import type { Availability, Category, Product, Settings } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { WaLink } from "./WaLink";

type Props = { products: Product[]; categories: Category[]; settings: Settings; base: string; preset?: string; title: string };
const PAGE = 12;
const AV_FILTERS: Availability[] = ["disponible", "consultar", "sin_stock"];

export function CatalogClient({ products, categories, settings, base, preset, title }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get("q") ?? "";
  const [cats, setCats] = useState<string[]>(preset ? [preset] : []);
  const [avail, setAvail] = useState<Availability[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("novedades");
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState(false);
  const ctx = { settings, base, categories };

  useEffect(() => {
    if (preset) {
      const c = categories.find((x) => x.id === preset);
      if (c && !c.is_offers) track("category_view", { category_id: c.id });
    }
  }, [preset, categories]);
  useEffect(() => setShown(PAGE), [q, cats, avail, min, max, sort]);

  const setQ = (v: string) => {
    const sp = new URLSearchParams(params.toString());
    if (v) sp.set("q", v); else sp.delete("q");
    router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
  };

  const results = useMemo(() => {
    const words = searchable(q).split(" ").filter(Boolean);
    const exact = q.trim().toUpperCase();
    const lo = parseInt(min.replace(/\D/g, "")) || 0;
    const hi = parseInt(max.replace(/\D/g, "")) || 0;
    const sel = categories.filter((c) => cats.includes(c.id));
    const r = products.filter((p) => {
      if (words.length) {
        const cat = categories.find((c) => c.id === p.category_id)?.name ?? "";
        const hay = searchable(`${p.name} ${p.sku} ${cat} ${p.materials} ${p.variants.join(" ")} ${p.description}`);
        if (!words.every((w) => hay.includes(w))) return false;
      }
      if (sel.length && !sel.some((c) => inCategory(p, c))) return false;
      if (avail.length && !avail.includes(p.availability)) return false;
      if ((lo || hi) && settings.show_prices) {
        if (!priceShown(p, settings)) return false;
        if (lo && p.price! < lo) return false;
        if (hi && p.price! > hi) return false;
      }
      return true;
    });
    const cmp = (a: Product, b: Product) =>
      sort === "nombre" ? a.name.localeCompare(b.name, "es")
      : sort === "precio-asc" ? (a.price ?? 0) - (b.price ?? 0)
      : sort === "precio-desc" ? (b.price ?? 0) - (a.price ?? 0)
      : b.created_at.localeCompare(a.created_at);
    r.sort(cmp);
    const i = r.findIndex((p) => p.sku === exact);
    if (i > 0) r.unshift(...r.splice(i, 1));
    return r;
  }, [products, categories, settings, q, cats, avail, min, max, sort]);

  const chips: { label: string; clear: () => void }[] = [
    ...(q ? [{ label: `“${q}”`, clear: () => setQ("") }] : []),
    ...cats.map((id) => ({ label: categories.find((c) => c.id === id)?.name ?? id, clear: () => setCats((c) => c.filter((x) => x !== id)) })),
    ...avail.map((a) => ({ label: AVAILABILITY[a], clear: () => setAvail((v) => v.filter((x) => x !== a)) })),
    ...(min ? [{ label: `Desde ${money(+min.replace(/\D/g, "") || 0)}`, clear: () => setMin("") }] : []),
    ...(max ? [{ label: `Hasta ${money(+max.replace(/\D/g, "") || 0)}`, clear: () => setMax("") }] : []),
  ];
  const clearAll = () => { setCats([]); setAvail([]); setMin(""); setMax(""); if (q) setQ(""); };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const crumbs = preset ? [["Inicio", "/"], ["Catálogo", "/catalogo"], [title, ""]] : [["Inicio", "/"], ["Catálogo", ""]];

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Ruta de navegación">
        {crumbs.map(([t, h], i) => (h ? <span key={i} style={{ display: "contents" }}><Link href={h}>{t}</Link><span aria-hidden>›</span></span> : <span key={i} aria-current="page">{t}</span>))}
      </nav>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 className="page-title">{title}</h1>
        <a className="btn btn-ghost btn-sm" href="/catalogo.pdf" target="_blank" rel="noopener"><FileDown />Descargar catálogo en PDF</a>
      </div>
      <div className="cat-layout">
        <div className={`sheet-bg ${sheet ? "open" : ""}`} onClick={() => setSheet(false)} />
        <aside className={`filters ${sheet ? "open" : ""}`} aria-label="Filtros">
          <div className="f-head only-m">Filtros<button className="icon-btn" onClick={() => setSheet(false)} aria-label="Cerrar filtros"><X /></button></div>
          <div className="f-group">
            <h4>Categoría</h4>
            {categories.map((c) => (
              <label className="check" key={c.id}>
                <input type="checkbox" checked={cats.includes(c.id)} onChange={() => { setCats((v) => toggle(v, c.id)); if (!cats.includes(c.id) && !c.is_offers) track("category_view", { category_id: c.id }); }} />
                {c.name}<em>{products.filter((p) => inCategory(p, c)).length}</em>
              </label>
            ))}
          </div>
          {settings.show_prices && (
            <div className="f-group">
              <h4>Precio</h4>
              <div className="price-in">
                <div className="field"><label htmlFor="f-min">Desde</label><input className="input" id="f-min" inputMode="numeric" placeholder="$ 0" value={min} onChange={(e) => setMin(e.target.value)} /></div>
                <div className="field"><label htmlFor="f-max">Hasta</label><input className="input" id="f-max" inputMode="numeric" placeholder="$ 50.000" value={max} onChange={(e) => setMax(e.target.value)} /></div>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>Al filtrar por precio no se muestran los productos sin precio publicado.</p>
            </div>
          )}
          <div className="f-group">
            <h4>Disponibilidad</h4>
            {AV_FILTERS.map((a) => (
              <label className="check" key={a}>
                <input type="checkbox" checked={avail.includes(a)} onChange={() => setAvail((v) => toggle(v, a))} />
                {AVAILABILITY[a]}<em>{products.filter((p) => p.availability === a).length}</em>
              </label>
            ))}
          </div>
          <button className="btn btn-dark btn-block only-m" onClick={() => setSheet(false)}>Ver {results.length} producto{results.length === 1 ? "" : "s"}</button>
        </aside>

        <div style={{ minWidth: 0 }}>
          <div className="cat-top">
            <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
              <Search aria-hidden />
              <input id="cat-q" type="search" placeholder="Buscar por SKU o palabra clave" aria-label="Buscar por SKU o palabra clave" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            </form>
            <button className="btn btn-ghost only-m" onClick={() => setSheet(true)}><SlidersHorizontal />Filtros</button>
            <select className="input" aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="novedades">Novedades</option>
              <option value="nombre">Nombre A–Z</option>
              {settings.show_prices && <option value="precio-asc">Menor precio</option>}
              {settings.show_prices && <option value="precio-desc">Mayor precio</option>}
            </select>
          </div>
          <div className="result-meta">
            <span><b>{results.length}</b> producto{results.length === 1 ? "" : "s"}</span>
            {chips.length > 0 && (
              <div className="chips">
                {chips.map((c) => <button key={c.label} className="chip" onClick={c.clear} aria-label={`Quitar filtro ${c.label}`}>{c.label}<X /></button>)}
                <button className="link-btn" style={{ fontSize: 13 }} onClick={clearAll}>Limpiar todo</button>
              </div>
            )}
          </div>
          {results.length ? (
            <ProductGrid products={results.slice(0, shown)} ctx={ctx} priorityFirst={4} />
          ) : (
            <div className="empty">
              <div className="ic"><SearchX /></div>
              <h3>No encontramos productos con esos filtros</h3>
              <p>{q ? `Probá con otra palabra o revisá la ortografía de “${q}”. También podés consultarnos: puede que lo tengamos aunque no esté en la web.` : "Probá quitando algún filtro."}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <button className="btn btn-ghost" onClick={clearAll}>Quitar filtros</button>
                <WaLink href={waLink(settings.whatsapp, q ? `Hola, ¿tienen ${q}?` : `Hola, quería hacer una consulta.`)} channel="general" className="btn btn-wa">Preguntar por WhatsApp</WaLink>
              </div>
            </div>
          )}
          {results.length > shown && (
            <div className="load-more">
              <span>Mostrando {shown} de {results.length}</span>
              <div className="progress"><i style={{ width: `${(shown / results.length) * 100}%` }} /></div>
              <button className="btn btn-ghost" onClick={() => setShown((s) => s + PAGE)}>Cargar más productos</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
