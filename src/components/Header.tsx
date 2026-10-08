"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight, CircleHelp, ClipboardList, FileDown, Heart, House, LayoutGrid, Menu, Search, Stamp, Tag, X,
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
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const units = list.reduce((a, i) => a + i.qty, 0);

  useEffect(() => setQ(params.get("q") ?? ""), [params]);
  useEffect(() => setMenu(false), [pathname]);

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
  const searchBox = (id: string) => (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
      <Search aria-hidden />
      <input id={id} type="search" value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Buscar por SKU o palabra clave (ej: V001, frascos)" aria-label="Buscar por SKU o palabra clave" autoComplete="off" />
    </form>
  );
  const nav: [string, string][] = [["/", "Inicio"], ["/catalogo", "Catálogo"], ["/ofertas", "Ofertas"], ["/#personalizados", "Personalizados"], ["/#preguntas", "Preguntas"]];

  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <button className="icon-btn only-m" onClick={() => setMenu(true)} aria-label="Abrir menú"><Menu /></button>
        <Link href="/" className="logo" aria-label={`${name}, inicio`}>
          <Logo name={name} priority />
          <span className="logo-tag">{tagline}</span>
        </Link>
        <nav className="nav only-d" aria-label="Secciones">
          {nav.map(([h, t]) => (
            <Link key={h} href={h} aria-current={pathname === h ? "page" : undefined}>{t}</Link>
          ))}
        </nav>
        {searchBox("hdr-q")}
        <div className="hdr-actions">
          <button className="icon-btn only-m" onClick={() => setMSearch((s) => !s)} aria-label="Buscar" aria-expanded={mSearch}><Search /></button>
          <Link className="icon-btn only-d" href="/favoritos" aria-label="Favoritos"><Heart /><span className="badge" data-n={favs.length}>{favs.length}</span></Link>
          <Link className="icon-btn" href="/lista" aria-label="Lista de consulta"><ClipboardList /><span className="badge" data-n={units}>{units}</span></Link>
          <WaLink href={waLink(whatsapp, msgGeneral(name))} channel="general" className="btn btn-wa btn-sm only-d">WhatsApp</WaLink>
        </div>
      </div>
      {mSearch && <div className="wrap m-search">{searchBox("m-q")}</div>}
      <div className="cats-bar only-d">
        <div className="wrap">
          {categories.map((c) => (
            <Link key={c.id} href={catHref(c)} className={c.is_offers ? "promo" : undefined}>{c.name}</Link>
          ))}
        </div>
      </div>

      <div className={`drawer-bg ${menu ? "open" : ""}`} onClick={() => setMenu(false)} />
      <aside className={`drawer left ${menu ? "open" : ""}`} aria-hidden={!menu} aria-label="Menú">
        <div className="drawer-head"><h3>{name}</h3><button className="icon-btn" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X /></button></div>
        <div className="drawer-body">
          <nav className="m-nav">
            {([["/", House, "Inicio"], ["/catalogo", LayoutGrid, "Catálogo"], ["/ofertas", Tag, "Ofertas"], ["/#personalizados", Stamp, "Productos con tu logo"], ["/#preguntas", CircleHelp, "Preguntas frecuentes"], ["/favoritos", Heart, "Favoritos"], ["/lista", ClipboardList, "Lista de consulta"]] as const).map(([h, I, t]) => (
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
          <WaLink href={waLink(whatsapp, msgGeneral(name))} channel="general" className="btn btn-wa">Escribinos por WhatsApp</WaLink>
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
