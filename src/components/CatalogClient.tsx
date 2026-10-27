"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, ArrowRight, Check, ChevronDown, FileDown, Filter, Search, SearchX, X } from "lucide-react";
import { AVAILABILITY, inCategory, money, priceShown, searchable, waLink } from "@/lib/format";
/* eslint-disable @next/next/no-img-element */
import { track } from "@/lib/track";
import { GROUPS, groupByKey, groupHref, groupOf } from "@/lib/groups";
import type { Availability, Category, CategoryGroup, Product, Settings } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { WaLink } from "./WaLink";

const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Tipo de producto, deducido del nombre. */
const TYPES: [string, RegExp][] = [
  ["Vasos", /\bvasos?\b/], ["Copas", /\bcopas?\b/], ["Tazas y mugs", /\b(tazas?|mugs?|pocillos?)\b/],
  ["Sillas", /^silla\b/], ["Sillones y sofás", /^(sillon|sofa)/], ["Banquetas", /^(banqueta|banquito)/], ["Mesas", /^mesa\b/],
  ["Boxes y bancos", /^box\b/], ["Reposeras y camastros", /^(reposera|camastro|daybed)/],
  ["Cubiertos y cuchillos", /^(cubiertos|cuchillo|tenedor|cuchara|cucharita|trinche|pinza)/],
  ["Platos", /^(plato|platito)/], ["Bowls", /^(bowl|bol)\b/], ["Teteras", /^tetera/], ["Bandejas y bases", /^(bandeja|base)\b/],
  ["Palitos", /^(palitos|apoya)/], ["Sets de vajilla", /^(set|vajilla|coleccion|linea|gres)\b/],
];
const typeOf = (p: Product) => { const n = norm(p.name); return TYPES.find(([, r]) => r.test(n))?.[0] ?? "Otros"; };

/** Materiales: los cargados en el producto más los que nombra la descripción. */
const MAT_WORDS: [string, RegExp][] = [
  ["Gres", /\bgres\b/], ["Porcelana", /porcelana/], ["Cerámica", /ceramic/], ["Vidrio", /vidrio|cristal/], ["Acero inoxidable", /acero/],
  ["Madera", /madera|nogal|roble|teca|olivo/], ["Bambú", /bambu/], ["Tapizado", /tapizad|capitone|terciopelo|acanalad/], ["Cuero", /cuero/],
  ["Rattan", /rattan|tejid|cuerda/], ["Aluminio", /aluminio/], ["Mármol", /marmol/], ["Hierro", /hierro/],
];
const matsOf = (p: Product) => { const t = norm(`${p.materials} ${p.name} ${p.description.split(".").slice(0, 2).join(" ")}`); return MAT_WORDS.filter(([, r]) => r.test(t)).map(([m]) => m); };

/** Color o tono, según el nombre y la descripción. */
const COLORS: [string, RegExp][] = [
  ["Blanco", /\bblanc/], ["Negro", /\bnegr/], ["Gris", /\bgris|granito|plata/], ["Beige y arena", /beige|arena|crema|crudo|nude|marfil/],
  ["Marrón y madera", /marron|madera natural|suela|chocolate|cafe|miel|nogal/], ["Azul", /\bazul|celeste|petroleo|marino/], ["Verde", /\bverde|oliva/],
  ["Rojo y bordó", /\broj|bordo|terracota|carmin/], ["Naranja y mostaza", /naranja|mostaza|amarill|ocre/], ["Rosa y violeta", /\brosa|violeta|lila/], ["Dorado", /dorad/],
  ["Transparente", /transparent/],
];
const colorsOf = (p: Product) => { const t = norm(`${p.name} ${p.description.split(".").slice(0, 2).join(" ")}`); return COLORS.filter(([, r]) => r.test(t)).map(([c]) => c); };

/** Menú desplegable de filtro con casillas (en celular se abre como panel inferior). */
function FilterMenu({ label, options, value, onChange, more = false }: { label: string; options: [string, number][]; value: string[]; onChange: (v: string[]) => void; more?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const n = value.length;
  return (
    <div className={`fdd ${open ? "open" : ""} ${more ? "fdd-more" : ""}`} ref={ref}>
      <button type="button" className={`fdd-btn ${n ? "on" : ""}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{more && <Filter aria-hidden />}{label}{n ? <b>{n}</b> : null}</span>{!more && <ChevronDown aria-hidden />}
      </button>
      {open && (
        <div className="fdd-menu" role="listbox" aria-multiselectable aria-label={label}>
          <div className="fdd-h"><span>{label}</span><button type="button" className="icon-btn" aria-label="Cerrar" onClick={() => setOpen(false)}><X /></button></div>
          <div className="fdd-list">
            {options.map(([o, c]) => (
              <label key={o} className="fdd-opt">
                <input type="checkbox" checked={value.includes(o)} onChange={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])} />
                <span className="fdd-box">{value.includes(o) && <Check />}</span>
                <span className="fdd-l">{o}</span><em>{c}</em>
              </label>
            ))}
          </div>
          <div className="fdd-f">
            <button type="button" className="link-btn" onClick={() => onChange([])} disabled={!n}>Limpiar</button>
            <button type="button" className="btn btn-cta btn-sm" onClick={() => setOpen(false)}>Listo</button>
          </div>
        </div>
      )}
    </div>
  );
}

type Props = { products: Product[]; categories: Category[]; settings: Settings; base: string; preset?: string; group?: CategoryGroup; title: string };
const PAGE = 12;
// Al volver atrás (popstate) el catálogo recupera cuántos productos mostraba y la posición de scroll
let lastPop = 0;
if (typeof window !== "undefined") window.addEventListener("popstate", () => { lastPop = Date.now(); });
const SCROLL_KEY = (url: string) => `saggio:cat:${url}`;
/** Tarjetas de grupo del catálogo (fotos en public/catalogo-grupos, 1600×800). */
const GROUP_CARDS: { key: CategoryGroup; name: string; line: string; img: string }[] = [
  { key: "mobiliario", name: "Mobiliario", line: "Sillas, sillones, sofás, banquetas, mesas y más.", img: "/catalogo-grupos/mobiliario.jpg" },
  { key: "bazar", name: "Bazar", line: "Vajilla, cristalería, cubiertos, utensilios y más.", img: "/catalogo-grupos/bazar.jpg" },
];
const AV_FILTERS: Availability[] = ["disponible", "consultar", "sin_stock"];

/** Categorías con foto preparada (public/categorias). */
const CATEGORY_IMG = new Set(["vajilla-blanca", "gres", "vajilla-decorada", "platos-y-bowls", "vajilla-oriental", "cubiertos", "cristaleria", "cafe", "sillas", "sofas-y-sillones", "banquetas", "boxes-y-bancos", "mesas", "sets", "exterior", "exterior-lounge"]);

export function CatalogClient({ products, categories, settings, base, preset, group, title }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get("q") ?? "";
  // ?cat=slug1,slug2 preselecciona categorías (accesos de la portada)
  const idsOf = (g: CategoryGroup) => categories.filter((c) => groupOf(c) === g).map((c) => c.id);
  // El grupo (?g=) y las categorías (?cat=) viven también en la URL para que "atrás" vuelva al mismo lugar
  const gParam = params.get("g");
  const urlGroup = gParam === "bazar" || gParam === "mobiliario" || gParam === "todo" ? (gParam as CategoryGroup | "todo") : null;
  const urlSlugs = (params.get("cat") ?? "").split(",").filter(Boolean);
  const defCats = preset ? [preset] : group ? idsOf(group) : [];
  const groupFromCats = (ids: string[]): CategoryGroup | "todo" => {
    const gs = new Set(categories.filter((c) => ids.includes(c.id)).map((c) => groupOf(c)));
    return ids.length && gs.size === 1 ? ([...gs][0] ?? "todo") : "todo";
  };
  const defGroup: CategoryGroup | "todo" = group ?? groupFromCats(defCats);
  const [cats, setCats] = useState<string[]>(() => {
    if (urlSlugs.length) return categories.filter((c) => urlSlugs.includes(c.slug)).map((c) => c.id);
    if (urlGroup) return urlGroup === "todo" ? [] : idsOf(urlGroup);
    return defCats;
  });
  // Grupo visible en el carrusel (Bazar / Mobiliario / todo)
  const [railGroup, setRailGroup] = useState<CategoryGroup | "todo">(() => urlGroup ?? (urlSlugs.length ? groupFromCats(cats) : defGroup));
  const [avail, setAvail] = useState<Availability[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [mats, setMats] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [extra, setExtra] = useState<string[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("novedades");
  const [shown, setShown] = useState(PAGE);
  const ctx = { settings, base, categories };
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preset) {
      const c = categories.find((x) => x.id === preset);
      if (c && !c.is_offers) track("category_view", { category_id: c.id });
    }
  }, [preset, categories]);
  const mounted = useRef(false);
  useEffect(() => { if (mounted.current) setShown(PAGE); }, [q, cats, avail, min, max, sort, types, mats, colors, extra]);

  // Grupo y categorías → URL (sin agregar entradas al historial)
  useEffect(() => {
    if (!mounted.current) return;
    const sp = new URLSearchParams(window.location.search);
    const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
    if (railGroup === defGroup) sp.delete("g"); else sp.set("g", railGroup);
    if (same(cats, defCats) || (railGroup !== "todo" && same(cats, idsOf(railGroup)))) sp.delete("cat");
    else sp.set("cat", categories.filter((c) => cats.includes(c.id)).map((c) => c.slug).join(","));
    const url = `${pathname}${sp.toString() ? `?${sp}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [railGroup, cats]);

  // Posición de scroll y cantidad de productos visibles, guardadas por URL
  const [restoreY, setRestoreY] = useState<number | null>(null);
  useEffect(() => {
    if (Date.now() - lastPop < 4000) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY(window.location.pathname + window.location.search)) ?? "null");
        if (saved) { setShown(Math.max(PAGE, saved.shown || PAGE)); setRestoreY(saved.y || 0); }
      } catch { /* sin almacenamiento disponible */ }
    }
    mounted.current = true;
  }, []);
  useEffect(() => {
    if (restoreY === null) return;
    let n = 0;
    const tick = () => { window.scrollTo(0, restoreY); if (++n < 6 && Math.abs(window.scrollY - restoreY) > 4) requestAnimationFrame(tick); else setRestoreY(null); };
    requestAnimationFrame(() => requestAnimationFrame(tick));
  }, [restoreY]);
  useEffect(() => {
    let raf = 0;
    const save = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try { sessionStorage.setItem(SCROLL_KEY(window.location.pathname + window.location.search), JSON.stringify({ y: window.scrollY, shown })); } catch { /* ignorar */ }
      });
    };
    save();
    window.addEventListener("scroll", save, { passive: true });
    return () => { window.removeEventListener("scroll", save); cancelAnimationFrame(raf); };
  }, [shown]);
  // Datos derivados para los filtros (tipo, material, color)
  const meta = useMemo(() => new Map(products.map((p) => [p.id, { type: typeOf(p), mats: matsOf(p), colors: colorsOf(p) }])), [products]);

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
      const m = meta.get(p.id)!;
      if (types.length && !types.includes(m.type)) return false;
      if (mats.length && !mats.some((x) => m.mats.includes(x))) return false;
      if (colors.length && !colors.some((x) => m.colors.includes(x))) return false;
      if (extra.includes("Ofertas") && p.tag !== "oferta") return false;
      if (extra.includes("Con vista 3D") && !p.model_url) return false;
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
  }, [products, categories, settings, q, cats, avail, min, max, sort, meta, types, mats, colors, extra]);

  // Opciones con cantidad, calculadas sobre lo que queda con el resto de los filtros (categoría y búsqueda)
  const pool = useMemo(() => {
    const sel = categories.filter((c) => cats.includes(c.id));
    return products.filter((p) => !sel.length || sel.some((c) => inCategory(p, c)));
  }, [products, categories, cats]);
  const count = (get: (p: Product) => string[]) => {
    const m = new Map<string, number>();
    for (const p of pool) for (const k of get(p)) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const typeOpts = count((p) => [meta.get(p.id)!.type]);
  const matOpts = count((p) => meta.get(p.id)!.mats);
  const colorOpts = count((p) => meta.get(p.id)!.colors);
  const availOpts: [string, number][] = AV_FILTERS.map((a) => [AVAILABILITY[a], pool.filter((p) => p.availability === a).length] as [string, number]).filter(([, n]) => n > 0);
  const extraOpts: [string, number][] = ([["Con vista 3D", pool.filter((p) => p.model_url).length], ["Ofertas", pool.filter((p) => p.tag === "oferta").length]] as [string, number][]).filter(([, n]) => n > 0);
  const catTiles = categories.filter((c) => !c.is_offers && (railGroup === "todo" || groupOf(c) === railGroup) && products.some((p) => inCategory(p, c)));
  const pickGroup = (g: CategoryGroup | "todo") => {
    setRailGroup(g); setCats(g === "todo" ? [] : idsOf(g)); railRef.current?.scrollTo({ left: 0 });
    // Sin grupo elegido los filtros quedan ocultos: se limpian para que no sigan aplicándose
    if (g === "todo") { setAvail([]); setTypes([]); setMats([]); setColors([]); setExtra([]); setMin(""); setMax(""); }
  };
  // Filtros visibles solo con un grupo elegido (o en búsquedas y en Ofertas)
  // Productos y filtros solo con una subcategoría elegida (o en búsquedas, Ofertas y páginas de subcategoría)
  const fullGroup = GROUPS.find((g) => { const ids = idsOf(g.key); return ids.length > 0 && ids.length === cats.length && ids.every((i) => cats.includes(i)); });
  const subPicked = cats.length > 0 && !fullGroup;
  const showFilters = subPicked || !!q || !!preset;
  const pickCat = (id: string) => {
    setCats((v) => (v.length === 1 && v[0] === id ? (railGroup === "todo" ? [] : idsOf(railGroup)) : [id]));
    const c = categories.find((x) => x.id === id);
    if (c && !c.is_offers) track("category_view", { category_id: c.id });
    // Al elegir una subcategoría, bajar suavemente hasta los productos
    if (!(cats.length === 1 && cats[0] === id)) {
      setTimeout(() => {
        const el = document.querySelector(".fbar");
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
      }, 80);
    }
  };

  const chips: { label: string; clear: () => void }[] = [
    ...(q ? [{ label: `“${q}”`, clear: () => setQ("") }] : []),
    ...(fullGroup ? [{ label: fullGroup.name, clear: () => pickGroup("todo") }] : cats.map((id) => ({ label: categories.find((c) => c.id === id)?.name ?? id, clear: () => setCats((c) => c.filter((x) => x !== id)) }))),
    ...avail.map((a) => ({ label: AVAILABILITY[a], clear: () => setAvail((v) => v.filter((x) => x !== a)) })),
    ...types.map((t) => ({ label: t, clear: () => setTypes((v) => v.filter((x) => x !== t)) })),
    ...mats.map((t) => ({ label: t, clear: () => setMats((v) => v.filter((x) => x !== t)) })),
    ...colors.map((t) => ({ label: t, clear: () => setColors((v) => v.filter((x) => x !== t)) })),
    ...extra.map((t) => ({ label: t, clear: () => setExtra((v) => v.filter((x) => x !== t)) })),
    ...(min ? [{ label: `Desde ${money(+min.replace(/\D/g, "") || 0)}`, clear: () => setMin("") }] : []),
    ...(max ? [{ label: `Hasta ${money(+max.replace(/\D/g, "") || 0)}`, clear: () => setMax("") }] : []),
  ];
  const clearAll = () => { setCats([]); setRailGroup("todo"); setAvail([]); setTypes([]); setMats([]); setColors([]); setExtra([]); setMin(""); setMax(""); if (q) setQ(""); };
  const more = results.length > shown;
  // Carga automática al llegar al final (el botón queda como respaldo)
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown((s) => s + PAGE); }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, shown]);

  const presetCat = preset ? categories.find((c) => c.id === preset) : undefined;
  const presetGroup = presetCat ? groupByKey(groupOf(presetCat) ?? "") : undefined;
  const crumbs = preset
    ? [["Inicio", "/"], ["Catálogo", "/catalogo"], ...(presetGroup ? [[presetGroup.name, groupHref(presetGroup.key)]] : []), [title, ""]]
    : group ? [["Inicio", "/"], ["Catálogo", "/catalogo"], [title, ""]] : [["Inicio", "/"], ["Catálogo", ""]];

  return (
    <div className="wrap">
      <nav className="crumbs only-d" aria-label="Ruta de navegación">
        {crumbs.map(([t, h], i) => (h ? <span key={i} style={{ display: "contents" }}><Link href={h}>{t}</Link><span aria-hidden>›</span></span> : <span key={i} aria-current="page">{t}</span>))}
      </nav>
      <div className="cat-title">
        <h1 className="page-title">{title}</h1>
        <a className="btn btn-ghost btn-sm only-d" href="/catalogo.pdf" target="_blank" rel="noopener"><FileDown />Descargar catálogo en PDF</a>
      </div>
      {/* Grupos: Mobiliario / Bazar (al elegir uno aparecen sus subcategorías) */}
      <div className="gcards" role="tablist" aria-label="Grupos de categorías">
        {GROUP_CARDS.map((g) => {
          const on = railGroup === g.key;
          return (
            <button key={g.key} type="button" role="tab" aria-selected={on} className={`gcard ${on ? "on" : ""}`} onClick={() => pickGroup(on ? "todo" : g.key)}>
              <img className="gcard-img" src={g.img} alt="" loading="eager" decoding="async" />
              <span className="gcard-txt">
                <b>{g.name}</b>
                <span>{g.line}</span>
                <i className="gcard-go" aria-hidden><ArrowRight /></i>
              </span>
            </button>
          );
        })}
      </div>
      {railGroup !== "todo" && <div className="crail">
        <div className="crail-track" ref={railRef} role="tablist" aria-label="Categorías" style={{ ["--n" as string]: catTiles.length }}>
          {catTiles.map((c) => {
            const on = !fullGroup && cats.includes(c.id);
            const img = CATEGORY_IMG.has(c.slug) ? `/categorias/${c.slug}.jpg` : null;
            return (
              <button key={c.id} type="button" role="tab" aria-selected={on} className={`crail-tile ${on ? "on" : ""}`} onClick={() => pickCat(c.id)}>
                <span className="crail-ph">{img && <img src={img} alt="" loading="lazy" decoding="async" />}</span>
                <span className="crail-n">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>}

      {/* Barra de búsqueda y filtros */}
      {showFilters && <div className="fbar">
        <form className="fbar-search" role="search" onSubmit={(e) => { e.preventDefault(); (e.currentTarget.querySelector("input") as HTMLInputElement)?.blur(); }}>
          <Search aria-hidden />
          <input id="cat-q" type="search" placeholder="Buscar producto…" aria-label="Buscar por nombre o código de producto" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </form>
        <span className="fbar-sep" aria-hidden />
        <div className="fbar-menus">
          <FilterMenu label="Tipo de producto" options={typeOpts} value={types} onChange={setTypes} />
          <FilterMenu label="Material" options={matOpts} value={mats} onChange={setMats} />
          <FilterMenu label="Color" options={colorOpts} value={colors} onChange={setColors} />
          <FilterMenu label="Disponibilidad" options={availOpts} value={avail.map((a) => AVAILABILITY[a])} onChange={(v) => setAvail(AV_FILTERS.filter((a) => v.includes(AVAILABILITY[a])))} />
          <FilterMenu label="Más filtros" options={extraOpts.length ? extraOpts : [["Con vista 3D", 0]]} value={extra} onChange={setExtra} more />
        </div>
      </div>}

      {!showFilters && (
        <div className="cat-pick-hint">
          {railGroup === "todo"
            ? <p>Elegí <b>Mobiliario</b> o <b>Bazar</b> para ver sus categorías.</p>
            : <p>Elegí una categoría para ver los productos.</p>}
        </div>
      )}
      {showFilters && <div className="fmeta">
        <div className="fmeta-chips">
          {showFilters && chips.length > 0 && <span className="fmeta-l">Filtros activos:</span>}
          {showFilters && chips.map((c) => <button key={c.label} className="chip" onClick={c.clear} aria-label={`Quitar filtro ${c.label}`}>{c.label}<X /></button>)}
          {showFilters && chips.length > 0 && <button className="fmeta-clear" onClick={clearAll}>Limpiar filtros</button>}
        </div>
        <div className="fmeta-r">
          <span className="fmeta-n"><b>{results.length}</b> producto{results.length === 1 ? "" : "s"}</span>
          <span className="fbar-sep" aria-hidden />
          <label className="fsort">
            <ArrowDownUp aria-hidden />
            <span className="only-d">Ordenar por:</span>
            <select aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="novedades">Novedades</option>
              <option value="nombre">Nombre A–Z</option>
              {settings.show_prices && <option value="precio-asc">Menor precio</option>}
              {settings.show_prices && <option value="precio-desc">Mayor precio</option>}
            </select>
            <ChevronDown aria-hidden />
          </label>
        </div>
      </div>}

      {showFilters && <div className="cat-full">
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
          {more && <div ref={sentinel} aria-hidden />}
          {more && (
            <div className="load-more">
              <span>Mostrando {shown} de {results.length}</span>
              <div className="progress"><i style={{ width: `${(shown / results.length) * 100}%` }} /></div>
              <button className="btn btn-ghost" onClick={() => setShown((s) => s + PAGE)}>Cargar más productos</button>
            </div>
          )}
      </div>}
    </div>
  );
}
