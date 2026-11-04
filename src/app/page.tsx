import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import { HeroCarousel } from "@/components/HeroCarousel";
import { WaSteps } from "@/components/WaSteps";
import { ArrowRight, Clock, CloudUpload, Droplet, FileDown, FilePen, Layers, ListPlus, MessageCircle, Package, Search, Tag, Zap } from "lucide-react";
import { ProductGrid } from "@/components/ProductCard";
import { WaLink } from "@/components/WaLink";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";
import { msgCustom, msgGeneral, msgQuote, waLink } from "@/lib/format";
import { GROUPS, groupHref } from "@/lib/groups";
import Image from "next/image";
/* eslint-disable @next/next/no-img-element */

export const revalidate = 300;



/** Accesos grandes de la portada: los dos grupos del catálogo. */
const HERO_GROUPS = [
  { title: "Mobiliario", line: "Espacios que inspiran hospitalidad.", href: "/categoria/mobiliario", img: "/catalogo-grupos/mobiliario.jpg", pos: "60% 55%" },
  { title: "Bazar", line: "Detalles que hacen la diferencia.", href: "/categoria/bazar", img: "/catalogo-grupos/bazar.jpg", pos: "60% 55%" },
];
/** Carrusel de productos destacados (fotos en public/destacados, 2048×768). side = lado del texto; fx = encuadre en celular. */
const FEATURED: { sku: string; eyebrow: string; line: string; img: string; alt: string; side: "left" | "right"; fx: number }[] = [
  { sku: "SOF-063", eyebrow: "Sillón", line: "Estructura de madera en A y tapizado verde petróleo: un clásico moderno para lobbies y salas de espera.", img: "/destacados/sillon-loano.jpg", alt: "Sillón Loano tapizado en verde petróleo con estructura de madera", side: "left", fx: 72 },
  { sku: "BAN-057", eyebrow: "Banqueta", line: "Respaldo de esterilla y asiento de cuero suela: estilo bistró para la barra.", img: "/destacados/banqueta-castelsardo.jpg", alt: "Banqueta Castelsardo con respaldo de esterilla y asiento de cuero", side: "left", fx: 72 },
  { sku: "MES-010", eyebrow: "Mesa", line: "Madera cálida y doble base de acero para el día a día del salón.", img: "/destacados/mesa-lajatico-3.jpg", alt: "Mesa Lajatico con tapa de madera y doble pie negro", side: "left", fx: 60 },
  { sku: "SIL-232", eyebrow: "Silla", line: "Madera cálida sobre estructura de acero negro: resistente para el ritmo del salón.", img: "/destacados/silla-canelli.jpg", alt: "Silla Canelli con asiento y respaldo de madera y estructura negra", side: "left", fx: 70 },
  { sku: "SOF-056", eyebrow: "Sillón", line: "Brazos curvos de madera y almohadón mullido: confort cálido para espacios de descanso.", img: "/destacados/sillon-san-teodoro.jpg", alt: "Sillón San Teodoro tapizado en crudo con estructura de madera curva", side: "left", fx: 72 },
  { sku: "BAN-096", eyebrow: "Banqueta", line: "Madera curvada con respaldo en Y y asiento tapizado: calidez nórdica a la altura de la barra.", img: "/destacados/banqueta-ziano.jpg", alt: "Banqueta Ziano de madera con respaldo en Y y asiento tapizado claro", side: "left", fx: 72 },
  { sku: "EXT-102", eyebrow: "Mesa de exterior", line: "Tapa de listones símil madera y pie de aluminio: lista para terrazas y veredas.", img: "/destacados/mesa-petritoli-2.jpg", alt: "Mesa Petritoli cuadrada con tapa de listones y pie central de aluminio", side: "right", fx: 34 },
];


export default async function Home() {
  const store = await getStore();
  const { settings, categories, products } = store;
  const d = settings.design;
  const base = siteUrl(settings.site_url);
  const ctx = { settings, base, categories };
  const offers = products.filter((p) => p.tag === "oferta").slice(0, 4);
  const realCats = categories.filter((c) => !c.is_offers);

  return (
    <div className="wrap">
      <div className="m-quick only-m">
        <HomeSearch />
        <nav className="quick-cats" aria-label="Categorías">
          {GROUPS.map((g) => <Link key={g.key} className="qc-group" href={groupHref(g.key)}>{g.name}</Link>)}
          {realCats.map((c) => <Link key={c.id} href={`/categoria/${c.slug}`}>{c.name}</Link>)}
        </nav>
      </div>
      <section className="hero2" aria-label="Presentación">
        <div className="h2-copy">
          <h1>{d.heroTitle}</h1>
          <p>{d.heroText}</p>
          <div className="hero-ctas">
            <Link className="btn btn-cta btn-lg" href="/catalogo">{d.heroCta}<ArrowRight /></Link>
            <WaLink href={waLink(settings.whatsapp, msgQuote(settings.business_name))} channel="quote" className="btn btn-ghost btn-lg">Pedir cotización</WaLink>
          </div>
        </div>
        <div className="h2-groups">
          {HERO_GROUPS.map((g, i) => (
            <Link key={g.href} className="h2-group" href={g.href}>
              <Image src={g.img} alt="" fill priority={i === 0} sizes="(max-width: 860px) 100vw, 56vw" style={{ objectPosition: g.pos }} />
              <span className="hg-txt">
                <b>{g.title}</b>
                <i aria-hidden />
                <small>{g.line}</small>
                <span className="hg-go" aria-hidden><ArrowRight /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>


      <HeroCarousel slides={FEATURED.flatMap((f) => {
        const p = products.find((x) => x.sku === f.sku);
        if (!p) return [];
        const c = categories.find((x) => x.id === p.category_id);
        return [{ ...f, title: p.name, href: `/producto/${p.slug}`, catHref: c ? `/categoria/${c.slug}` : undefined, catLabel: c ? `Ver ${c.name.split(":")[0].toLowerCase()}` : undefined }];
      })} />



      {offers.length > 0 && (
        <section className="sec" aria-labelledby="h-off">
          <div className="band">
            <div className="sec-head"><div><span className="eyebrow">Promoción</span><h2 id="h-off" style={{ marginTop: 6 }}>{d.promoTitle}</h2><p>{d.promoText}</p></div><Link href="/ofertas">Todas las ofertas <ArrowRight /></Link></div>
            <ProductGrid products={offers} ctx={ctx} rail />
          </div>
        </section>
      )}


      <section className="sec" id="contacto">
        <div className="wa-banner">
          <div>
            <h2>{d.waTitle}</h2>
            <p>{d.waText}</p>
            <WaSteps wa={waLink(settings.whatsapp, msgGeneral(settings.business_name))} hours={settings.hours} />
          </div>
          <WaLink href={waLink(settings.whatsapp, msgGeneral(settings.business_name))} channel="general" className="btn btn-wa btn-lg">Escribinos por WhatsApp</WaLink>
        </div>
      </section>
    </div>
  );
}
