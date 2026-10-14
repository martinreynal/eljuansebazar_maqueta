"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown, ChevronRight, CircleHelp, ClipboardList, FileDown, Heart, House, LayoutGrid, Menu, Search, Stamp, Tag, X,
} from "lucide-react";
import { msgGeneral, waLink } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Logo } from "./Logo";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";

type Props = { name: string; tagline: string; whatsapp: string; categories: Pick<Category, "id" | "slug" | "name" | "is_offers">[] };

const catHref = (c: { slug: string; is_offers: boolean }) => (c.is_offers ? "/ofertas" : `/categoria/${c.slug}`);

export function Header({ name, tagline, whatsapp, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { list, favs } = useStore();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [menu, setMenu] = useState(false);
  const [mSearch, setMSearch] = useState(false);
  const [cats, setCats] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQ(params.get("q") ?? ""), [params]);
  useEffect(() => { setMenu(false); setCats(false); setMSearch(false); }, [pathname]);
  // Cerrar el menú de categorías al hacer clic afuera o con Escape
  useEffect(() => {
    if (!cats) return;
    const onDown = (e: MouseEvent) => { if (!catsRef.current?.contains(e.target as Node)) setCats(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCats(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [cats]);
  // Atajo: "/" enfoca el buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // La pestaña "Buscar" de la barra inferior abre el buscador (en el catálogo enfoca su propio campo)
  useEffect(() => {
    const open = () => {
      const cat = document.getElementById("cat-q") as HTMLInputElement | null;
      if (cat) { cat.focus(); cat.scrollIntoView({ block: "nearest" }); return; }
      setMSearch(true);
      setTimeout(() => (document.getElementById("m-q") as HTMLInputElement | null)?.focus(), 30);
    };
    window.addEventListener("ejb:search", open);
    return () => window.removeEventListener("ejb:search", open);
  }, []);

  if (pathname.startsWith("/admin")) return <AdminBar name={name} />;

  const onSearch = (v: string) => {
    setQ(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const sp = new URLSearchParams(pathname === "/catalogo" ? params.toString() : "");
      if (v.trim()) sp.set("q", v); else sp.delete("q");
      const url = `/catalogo${sp.toString() ? `?${sp}` : ""}`;
      if (pathname === "/catalogo") router.replace(url, { scroll: false });
      else if (v.trim()) router.push(url);
    }, 180);
  };
  const searchBox = (id: string, ref?: React.Ref<HTMLInputElement>, autoFocus = false) => (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q); (e.currentTarget.querySelector("input") as HTMLInputElement)?.blur(); }}>
      <Search aria-hidden />
      <input ref={ref} id={id} type="search" value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Buscar producto o código" aria-label="Buscar por nombre o código de producto" autoComplete="off" enterKeyHint="search" autoFocus={autoFocus} />
      {q ? (
        <button type="button" className="search-x" onClick={() => onSearch("")} aria-label="Borrar búsqueda"><X /></button>
      ) : (
        <kbd className="search-kbd" aria-hidden>/</kbd>
      )}
    </form>
  );
  const hasOffers = categories.some((c) => c.is_offers);
  const inCatalog = pathname.startsWith("/catalogo") || /^\/(categoria|producto|ofertas)/.test(pathname);
  const waHref = waLink(whatsapp, msgGeneral(name));

  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <button className="icon-btn only-m" onClick={() => setMenu(true)} aria-label="Abrir menú"><Menu /></button>
        <Link href="/" className="logo" aria-label={`${name}, inicio`}>
          <Logo name={name} priority />
          <span className="logo-tag">{tagline}</span>
        </Link>

        <nav className="nav only-d" aria-label="Secciones">
          <div className="nav-dd" ref={catsRef} onMouseLeave={() => setCats(false)}>
            <Link href="/catalogo" aria-current={inCatalog ? "page" : undefined} onMouseEnter={() => setCats(true)} onFocus={() => setCats(true)}>
              Catálogo
            </Link>
            <button type="button" className="nav-dd-btn" aria-label="Ver categorías" aria-expanded={cats} aria-haspopup="true" onClick={() => setCats((v) => !v)}><ChevronDown /></button>
            <div className={`dd ${cats ? "open" : ""}`} role="menu">
              <div className="dd-grid">
                {categories.map((c) => (
                  <Link key={c.id} role="menuitem" href={catHref(c)} className={c.is_offers ? "promo" : undefined} aria-current={pathname === catHref(c) ? "page" : undefined}>{c.name}</Link>
                ))}
              </div>
              <div className="dd-foot">
                <Link href="/catalogo" role="menuitem">Ver todo el catálogo<ChevronRight /></Link>
                <a href="/catalogo.pdf" target="_blank" rel="noopener" role="menuitem"><FileDown />Descargar PDF</a>
              </div>
            </div>
          </div>
          {hasOffers && <Link href="/ofertas" className="promo" aria-current={pathname === "/ofertas" ? "page" : undefined}>Ofertas</Link>}
          <Link href="/#personalizados">Personalizados</Link>
          <Link href="/#preguntas" className="nav-faq">Preguntas</Link>
        </nav>

        <div className="hdr-search only-d">{searchBox("hdr-q", searchRef)}</div>

        <div className="hdr-actions">
          <Link className="icon-btn" href="/favoritos" aria-label={`Favoritos (${favs.length})`} title="Favoritos" aria-current={pathname === "/favoritos" ? "page" : undefined}>
            <Heart /><span className="badge" data-n={favs.length} key={favs.length}>{favs.length}</span>
          </Link>
          <Link className={`list-btn only-d ${list.length ? "has" : ""}`} href="/lista" aria-label={`Lista de consulta (${list.length} productos)`} title="Lista de consulta" aria-current={pathname === "/lista" ? "page" : undefined}>
            <ClipboardList />
            <span className="list-btn-t">Mi lista</span>
            <span className="list-btn-n" data-n={list.length} key={list.length}>{list.length}</span>
          </Link>
          <WaLink href={waHref} channel="general" className="btn btn-wa btn-sm hdr-wa only-d" label="Escribinos por WhatsApp"><span>WhatsApp</span></WaLink>
        </div>
      </div>
      {mSearch && (
        <div className="wrap m-search only-m">
          {searchBox("m-q", undefined, true)}
          <button type="button" className="link-btn m-search-x" onClick={() => setMSearch(false)}>Cancelar</button>
        </div>
      )}

      <div className={`drawer-bg ${menu ? "open" : ""}`} onClick={() => setMenu(false)} />
      <aside className={`drawer left ${menu ? "open" : ""}`} aria-hidden={!menu} aria-label="Menú">
        <div className="drawer-head"><h3>{name}</h3><button className="icon-btn" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X /></button></div>
        <div className="drawer-body">
          <nav className="m-nav">
            {([["/", House, "Inicio"], ["/catalogo", LayoutGrid, "Catálogo"], ["/ofertas", Tag, "Ofertas"], ["/#personalizados", Stamp, "Productos con tu logo"], ["/#preguntas", CircleHelp, "Preguntas frecuentes"], ["/favoritos", Heart, "Favoritos"], ["/lista", ClipboardList, "Lista de consulta"]] as const).filter(([h]) => hasOffers || h !== "/ofertas").map(([h, I, t]) => (
              <Link key={h} href={h} onClick={() => setMenu(false)}><I />{t}<ChevronRight /></Link>
            ))}
            <a href="/catalogo.pdf" target="_blank" rel="noopener"><FileDown />Catálogo en PDF<ChevronRight /></a>
          </nav>
          <span className="eyebrow">Categorías</span>
          <nav className="m-nav">
            {categories.map((c) => (
              <Link key={c.id} href={catHref(c)} onClick={() => setMenu(false)}>{c.name}<ChevronRight /></Link>
            ))}
          </nav>
          <WaLink href={waHref} channel="general" className="btn btn-wa">Escribinos por WhatsApp</WaLink>
        </div>
      </aside>
    </header>
  );
}

function AdminBar({ name }: { name: string }) {
  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <Link href="/admin" className="logo" aria-label={`Panel de ${name}`}><Logo name={name} /><span className="logo-tag">Panel administrador</span></Link>
        <span style={{ flex: 1 }} />
        <Link className="btn btn-ghost btn-sm" href="/" target="_blank">Ver tienda</Link>
      </div>
    </header>
  );
}
