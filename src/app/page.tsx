import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import { HeroCarousel } from "@/components/HeroCarousel";
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
  { sku: "SIL-012", eyebrow: "Silla", line: "Tapizado azul y madera clara: calidez y confort para cada mesa.", img: "/destacados/silla-numana-2.jpg", alt: "Silla Numana tapizada en azul con patas de madera clara", side: "left", fx: 55 },
  { sku: "SOF-016", eyebrow: "Sillón", line: "Cuero y estructura metálica para lobbies y salones con carácter.", img: "/destacados/sillon-certaldo.jpg", alt: "Sillón Certaldo de cuero marrón con estructura negra", side: "left", fx: 60 },
  { sku: "BAN-009", eyebrow: "Banqueta", line: "Altura de barra con respaldo envolvente y tapizado en contraste.", img: "/destacados/banqueta-rossano.jpg", alt: "Banqueta Rossano tapizada en rojo con patas de madera", side: "right", fx: 38 },
  { sku: "MES-010", eyebrow: "Mesa", line: "Madera cálida y doble base de acero para el día a día del salón.", img: "/destacados/mesa-lajatico.jpg", alt: "Mesa Lajatico con tapa de madera y doble pie negro", side: "right", fx: 54 },
  { sku: "EXT-018", eyebrow: "Sillón de exterior", line: "Trama natural y estructura liviana para terrazas y galerías.", img: "/destacados/sillon-lodi.jpg", alt: "Sillón Lodi de fibra natural tejida", side: "left", fx: 58 },
  { sku: "EXT-011", eyebrow: "Set de exterior", line: "Mesa y cuatro sillones listos para el patio o la vereda.", img: "/destacados/set-todi.jpg", alt: "Set Todi de mesa y cuatro sillones de exterior", side: "left", fx: 50 },
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
            <div className="steps"><span><Search />Buscá</span><span><ListPlus />Armá tu lista</span><span><MessageCircle />Consultanos</span>{settings.hours && <span><Clock />{settings.hours}</span>}</div>
          </div>
          <WaLink href={waLink(settings.whatsapp, msgGeneral(settings.business_name))} channel="general" className="btn btn-wa btn-lg">Escribinos por WhatsApp</WaLink>
        </div>
      </section>
    </div>
  );
}
