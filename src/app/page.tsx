import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import { Armchair, ArrowRight, ChevronRight, Clock, Coffee, ConciergeBell, CookingPot, Droplet, FileDown, Headset, ListPlus, Martini, MessageCircle, Search, Stamp, Tag, Truck, Utensils, Wine, Zap, type LucideProps } from "lucide-react";
import { CustomArt } from "@/components/Art";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { WaLink } from "@/components/WaLink";
import { getStore, getTopProductIds } from "@/lib/data";
import { mediaUrl, siteUrl } from "@/lib/env";
import { inCategory, msgCustom, msgGeneral, msgQuote, waLink } from "@/lib/format";
import Image from "next/image";
/* eslint-disable @next/next/no-img-element */

export const revalidate = 300;

const VAJILLA = "vajilla-estandar,gres,vajilla-blanca,vajilla-decorada,vajilla-marmolada";
const MOBILIARIO = "sillas,mesas,banquetas,boxes-y-bancos,sofas-y-sillones,mesas-auxiliares,exterior";

/** Plato visto desde arriba (no hay ícono de plato en la librería). */
function Plate(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" width={24} height={24} {...props}>
      <circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="6" />
    </svg>
  );
}

const SIDE = [
  { title: "Colección institucional", href: "/categoria/vajilla-blanca", img: "/portada/coleccion-institucional.jpg", pos: "50% 30%" },
  { title: "Línea artesanal", href: "/categoria/gres", img: "/portada/linea-artesanal.jpg", pos: "50% 45%" },
  { title: "Soluciones para tu cocina", href: "/categoria/vajilla-oriental", img: "/portada/cocina.jpg", pos: "55% 50%" },
];
const ICONS: [string, string, (p: LucideProps) => React.ReactNode][] = [
  ["Vajilla", `/catalogo?cat=${VAJILLA}`, Plate],
  ["Cristalería", "/categoria/cristaleria", Wine],
  ["Cubiertos", "/categoria/cubiertos", Utensils],
  ["Utensilios de cocina", "/catalogo?cat=cubiertos,vajilla-oriental", CookingPot],
  ["Mobiliario gastronómico", `/catalogo?cat=${MOBILIARIO}`, Armchair],
  ["Cafetería", "/categoria/cafe", Coffee],
  ["Bar y coctelería", "/catalogo?cat=cristaleria,cafe", Martini],
  ["Servicio de mesa", "/catalogo?cat=vajilla-blanca,vajilla-decorada,cubiertos,cristaleria", ConciergeBell],
];
const BANNERS = [
  { title: "Mobiliario gastronómico", href: `/catalogo?cat=${MOBILIARIO}`, img: "/portada/mobiliario.jpg", pos: "50% 60%" },
  { title: "Vajilla profesional", href: `/catalogo?cat=${VAJILLA}`, img: "/portada/mesa-servida.jpg", pos: "40% 70%" },
  { title: "Cristalería para cada ocasión", href: "/categoria/cristaleria", img: "/portada/cristaleria.jpg", pos: "50% 45%" },
];

/** Categorías con foto de portada preparada (public/categorias, ver scripts/portada-categorias.py). */
const CATEGORY_COVERS = new Set(["vajilla-estandar", "gres", "vajilla-blanca", "vajilla-decorada", "vajilla-marmolada", "cubiertos", "cristaleria", "cafe", "vajilla-oriental", "sillas", "mesas", "banquetas", "boxes-y-bancos", "sofas-y-sillones", "mesas-auxiliares", "exterior"]);

export default async function Home() {
  const store = await getStore();
  const { settings, categories, products, faqs, customWorks } = store;
  const d = settings.design;
  const base = siteUrl(settings.site_url);
  const ctx = { settings, base, categories };
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const offers = products.filter((p) => p.tag === "oferta").slice(0, 4);
  const fresh = products.slice(0, 4);
  const topIds = await getTopProductIds();
  const byId = new Map(products.map((p) => [p.id, p]));
  const top = [...topIds.map((id) => byId.get(id)).filter(Boolean), ...products.filter((p) => p.featured), ...products]
    .filter((p, i, a) => p && a.indexOf(p) === i)
    .slice(0, 6) as typeof products;
  const realCats = categories.filter((c) => !c.is_offers);

  return (
    <div className="wrap">
      <div className="m-quick only-m">
        <HomeSearch />
        <nav className="quick-cats" aria-label="Categorías">
          {realCats.map((c) => <Link key={c.id} href={`/categoria/${c.slug}`}>{c.name}</Link>)}
        </nav>
      </div>
      <section className="hero2" aria-label="Presentación">
        <div className="h2-copy">
          <span className="h2-eyebrow">{d.heroEyebrow}</span>
          <h1>{d.heroTitle}</h1>
          <p>{d.heroText}</p>
          <div className="hero-ctas">
            <Link className="btn btn-cta btn-lg" href="/catalogo">{d.heroCta}<ArrowRight /></Link>
            <WaLink href={waLink(settings.whatsapp, msgQuote(settings.business_name))} channel="quote" className="btn btn-ghost btn-lg">Pedir cotización</WaLink>
          </div>
          <div className="h2-facts">
            <div><Headset /><span>Atención por<br />WhatsApp</span></div>
            <div><Truck /><span>Envíos a<br />todo el país</span></div>
            <div><Tag /><span>Productos<br />personalizables</span></div>
          </div>
        </div>
        <Link className="h2-main" href="/catalogo">
          {/* Vertical en computadora; apaisada en tablet y celular */}
          <Image className="h2-v" src="/portada/mesa-servida-vertical.jpg" alt="Mesa servida con vajilla de gres, copas y cubiertos" fill priority sizes="(max-width: 1180px) 1px, 36vw" style={{ objectPosition: "50% 62%" }} />
          <Image className="h2-h" src="/portada/mesa-servida.jpg" alt="" fill sizes="(max-width: 1180px) 100vw, 1px" style={{ objectPosition: "45% 70%" }} />
          <span className="h2-cap"><i />Vajilla que realza<br />tu propuesta.</span>
        </Link>
        <div className="h2-side">
          {SIDE.map((t) => (
            <Link key={t.href} className="h2-tile" href={t.href}>
              <Image src={t.img} alt="" fill sizes="(max-width: 860px) 33vw, 19vw" style={{ objectPosition: t.pos }} />
              <span>{t.title}</span>
              <b aria-hidden><ArrowRight /></b>
            </Link>
          ))}
        </div>
      </section>

      <nav className="h2-icons" aria-label="Rubros">
        {ICONS.map(([label, href, I]) => (
          <Link key={label} href={href}><I aria-hidden /><span>{label}</span></Link>
        ))}
      </nav>

      <section className="h2-banners" aria-label="Destacados">
        {BANNERS.map((b) => (
          <Link key={b.title} className="h2-banner" href={b.href}>
            <Image src={b.img} alt="" fill sizes="(max-width: 860px) 85vw, 33vw" style={{ objectPosition: b.pos }} />
            <span>{b.title}<ArrowRight aria-hidden /></span>
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
        <div className="cat-grid cat-rail">
          {realCats.map((c) => {
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
      </section>

      {featured.length > 0 && (
        <section className="sec" aria-labelledby="h-feat">
          <div className="sec-head"><div><h2 id="h-feat">Destacados del mes</h2><p>Los artículos que más recomendamos.</p></div><Link href="/catalogo">Ver más <ArrowRight /></Link></div>
          <ProductGrid products={featured} ctx={ctx} rail />
        </section>
      )}

      {offers.length > 0 && (
        <section className="sec" aria-labelledby="h-off">
          <div className="band">
            <div className="sec-head"><div><span className="eyebrow">Promoción</span><h2 id="h-off" style={{ marginTop: 6 }}>{d.promoTitle}</h2><p>{d.promoText}</p></div><Link href="/ofertas">Todas las ofertas <ArrowRight /></Link></div>
            <ProductGrid products={offers} ctx={ctx} rail />
          </div>
        </section>
      )}

      <section className="sec" id="personalizados" aria-labelledby="h-custom">
        <div className="custom">
          <div>
            <span className="eyebrow">{d.customEyebrow}</span>
            <h2 id="h-custom">{d.customTitle}</h2>
            <p className="lead">{d.customText}</p>
            <div className="tech"><span><Zap />Grabado láser</span><span><Droplet />Sublimación</span><span><Stamp />Serigrafía</span><span><Tag />Etiquetas</span></div>
            <ol className="flow">
              <li><span><b>Nos mandás tu logo</b>En PDF, AI o PNG en buena calidad, con la cantidad y los productos que te interesan.</span></li>
              <li><span><b>Te enviamos boceto y presupuesto</b>Ves cómo queda antes de confirmar.</span></li>
              <li><span><b>Producimos y enviamos</b>A tu oficina o a cualquier punto del país.</span></li>
            </ol>
            <div className="hero-ctas" style={{ marginTop: 22 }}>
              <WaLink href={waLink(settings.whatsapp, msgCustom())} channel="custom" className="btn btn-wa btn-lg">Pedir presupuesto con mi logo</WaLink>
            </div>
          </div>
          <div className="mocks">
            {customWorks.slice(0, 4).map((w) => {
              const img = mediaUrl(w.image_path);
              return (
                <div className="mock" key={w.id}>
                  <figure>
                    <div className="ph">
                      {img ? <span className="media-fill"><Image src={img} alt={w.title} fill sizes="(max-width: 860px) 50vw, 25vw" unoptimized={img.startsWith("/")} /></span> : w.placeholder ? <CustomArt ph={w.placeholder} /> : null}
                    </div>
                    <figcaption><span><b>{w.title}</b>{w.technique && ` · ${w.technique}`}</span><span className="mono">{w.quantity}</span></figcaption>
                  </figure>
                </div>
              );
            })}
          </div>
        </div>
        {customWorks.some((w) => !w.image_path) && <p className="hint" style={{ marginTop: 10 }}>Algunas imágenes son mockups ilustrativos con marcas de ejemplo.</p>}
      </section>

      <section className="sec" aria-labelledby="h-new">
        <div className="sec-head"><div><h2 id="h-new">Recién llegados</h2><p>Lo último que entró al catálogo.</p></div><Link href="/catalogo">Ver novedades <ArrowRight /></Link></div>
        <ProductGrid products={fresh} ctx={ctx} rail />
      </section>

      <section className="sec" aria-labelledby="h-top">
        <div className="sec-head"><div><h2 id="h-top">Los más consultados</h2><p>Lo que más nos preguntan por WhatsApp.</p></div></div>
        <div className="rank">
          {top.map((p, i) => (
            <Link key={p.id} href={`/producto/${p.slug}`}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="t"><ProductImage p={p} view={1} label={false} sizes="64px" /></span>
              <span><b>{p.name}</b><small><span className="mono">{p.sku}</span> · {categories.find((c) => c.id === p.category_id)?.name}</small></span>
              <ChevronRight />
            </Link>
          ))}
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="sec" id="preguntas" aria-labelledby="h-faq">
          <div className="faq-wrap">
            <div className="side">
              <h2 id="h-faq" style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 800, letterSpacing: "-.03em" }}>Preguntas frecuentes</h2>
              <p>Lo que más nos consultan antes de comprar. ¿No está tu duda? Escribinos.</p>
              <WaLink href={waLink(settings.whatsapp, msgGeneral(settings.business_name))} channel="general" className="btn btn-ghost" >Hacer otra pregunta</WaLink>
            </div>
            <div className="faq">
              {faqs.map((f, i) => (
                <details key={f.id} open={i === 0}>
                  <summary>{f.question}<span aria-hidden className="plus">+</span></summary>
                  <div className="ans">{f.answer}</div>
                </details>
              ))}
            </div>
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }) }} />
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
