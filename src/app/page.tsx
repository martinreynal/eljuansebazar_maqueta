import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import { ArrowRight, Clock, CloudUpload, Droplet, FileDown, FilePen, Layers, ListPlus, MessageCircle, Package, Search, Tag, Zap } from "lucide-react";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { WaLink } from "@/components/WaLink";
import { getStore } from "@/lib/data";
import { mediaUrl, siteUrl } from "@/lib/env";
import { inCategory, msgCustom, msgGeneral, msgQuote, waLink } from "@/lib/format";
import { GROUPS, groupHref, groupOf } from "@/lib/groups";
import Image from "next/image";
/* eslint-disable @next/next/no-img-element */

export const revalidate = 300;



/** Accesos grandes de la portada: los dos grupos del catálogo. */
const HERO_GROUPS = [
  { title: "Mobiliario", line: "Espacios que inspiran hospitalidad.", href: "/categoria/mobiliario", img: "/catalogo-grupos/mobiliario.jpg", pos: "60% 55%" },
  { title: "Bazar", line: "Detalles que hacen la diferencia.", href: "/categoria/bazar", img: "/catalogo-grupos/bazar.jpg", pos: "60% 55%" },
];
const BANNERS = [
  { title: "Sillas", line: "Comodidad que realza tus espacios.", href: "/categoria/sillas", img: "/portada/banner-sillas-2.jpg", pos: "50% 55%", tone: "petrol" },
  { title: "Cristalería", line: "Transparencia para grandes momentos.", href: "/categoria/cristaleria", img: "/portada/banner-cristaleria-2.jpg", pos: "50% 50%", tone: "sand" },
  { title: "Mesas", line: "El centro de cada encuentro.", href: "/categoria/mesas", img: "/portada/banner-mesas-2.jpg", pos: "50% 55%", tone: "petrol" },
  { title: "Cubiertos", line: "Funcionalidad y estilo en cada servicio.", href: "/categoria/cubiertos", img: "/portada/banner-cubiertos-2.jpg", pos: "50% 50%", tone: "sand" },
];

/** Categorías con foto de portada preparada (public/categorias, ver scripts/portada-categorias.py). */
const CATEGORY_COVERS = new Set(["vajilla-blanca", "gres", "vajilla-decorada", "vajilla-marmolada", "platos-y-bowls", "vajilla-oriental", "cubiertos", "cristaleria", "cafe", "sillas", "sofas-y-sillones", "banquetas", "boxes-y-bancos", "mesas", "mesas-auxiliares", "exterior", "exterior-lounge"]);

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


      <section className="h2-banners" aria-label="Destacados">
        {BANNERS.map((b) => (
          <Link key={b.title} className={`h2-banner ${b.tone}`} href={b.href}>
            <span className="bn-img"><Image src={b.img} alt="" fill sizes="(max-width: 860px) 70vw, 25vw" style={{ objectPosition: b.pos }} /></span>
            <span className="bn-txt"><b>{b.title}</b><i aria-hidden /><small>{b.line}</small></span>
          </Link>
        ))}
      </section>

      <section className="sec" aria-labelledby="h-cats">
        <div className="sec-head">
          <div><h2 id="h-cats">Explorá por categoría</h2></div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/catalogo.pdf" target="_blank" rel="noopener"><FileDown /> Catálogo PDF</a>
            <Link href="/catalogo">Todo el catálogo <ArrowRight /></Link>
          </div>
        </div>
        {GROUPS.filter((g) => realCats.some((c) => groupOf(c) === g.key)).map((g) => (
          <div key={g.key} className="cat-group">
            <div className="cat-group-h">
              <h3><Link href={groupHref(g.key)}>{g.name}</Link></h3>
              <span>{g.line}</span>
              <Link className="cat-group-all" href={groupHref(g.key)}>Ver todo {g.name.toLowerCase()} <ArrowRight /></Link>
            </div>
            <div className="cat-grid cat-rail">
              {realCats.filter((c) => groupOf(c) === g.key).map((c) => {
                const n = products.filter((p) => inCategory(p, c)).length;
                const cover = products.find((p) => p.category_id === c.id);
                const img = CATEGORY_COVERS.has(c.slug) ? `/categorias/${c.slug}.jpg` : mediaUrl(c.image_path);
                return (
                  <Link key={c.id} className="cat-tile" href={`/categoria/${c.slug}`}>
                    <div className="ph">
                      {img ? <img className="cat-cover" src={img} alt="" width={600} height={600} loading="lazy" decoding="async" /> : cover ? <ProductImage p={cover} view={1} label={false} sizes="(max-width: 560px) 33vw, 14vw" /> : null}
                    </div>
                    <b>{c.name}</b>
                    <span>{n} producto{n === 1 ? "" : "s"}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>


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
