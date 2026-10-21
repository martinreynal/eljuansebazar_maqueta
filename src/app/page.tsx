import Link from "next/link";
import { HomeSearch } from "@/components/HomeSearch";
import { Armchair, ArrowRight, Clock, CloudUpload, Coffee, ConciergeBell, CookingPot, Droplet, FileDown, FilePen, Layers, ListPlus, Martini, MessageCircle, Package, Search, Tag, Utensils, Wine, Zap, type LucideProps } from "lucide-react";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { WaLink } from "@/components/WaLink";
import { getStore } from "@/lib/data";
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
const BRAND_WORKS = [
  { title: "Tazas de cerámica", sku: "CER-07", tech: "Sublimación o serigrafía", img: "/portada/marca-taza.jpg" },
  { title: "Bandejas de bambú", sku: "BAM-01", tech: "Grabado láser", img: "/portada/marca-bandeja.jpg" },
  { title: "Vasos de vidrio", sku: "CRI-14", tech: "Serigrafía", img: "/portada/marca-vaso.jpg" },
  { title: "Cuchillos de asado", sku: "CUB-40", tech: "Grabado láser en la hoja", img: "/portada/marca-cuchillo.jpg" },
];
const BANNERS = [
  { title: "Vajilla", line: "Piezas que realzan cada creación.", href: `/catalogo?cat=${VAJILLA}`, img: "/portada/mesa-servida.jpg", pos: "40% 70%", tone: "petrol" },
  { title: "Cristalería", line: "Transparencia para grandes momentos.", href: "/categoria/cristaleria", img: "/portada/cristaleria.jpg", pos: "45% 50%", tone: "sand" },
  { title: "Mobiliario", line: "Espacios que inspiran hospitalidad.", href: `/catalogo?cat=${MOBILIARIO}`, img: "/portada/mobiliario.jpg", pos: "35% 60%", tone: "petrol" },
  { title: "Personalización", line: "Tu marca también en cada detalle.", href: "/#personalizados", img: "/portada/marca-taza.jpg", pos: "50% 45%", tone: "sand" },
];

/** Categorías con foto de portada preparada (public/categorias, ver scripts/portada-categorias.py). */
const CATEGORY_COVERS = new Set(["vajilla-estandar", "gres", "vajilla-blanca", "vajilla-decorada", "vajilla-marmolada", "cubiertos", "cristaleria", "cafe", "vajilla-oriental", "sillas", "mesas", "banquetas", "boxes-y-bancos", "sofas-y-sillones", "mesas-auxiliares", "exterior"]);

export default async function Home() {
  const store = await getStore();
  const { settings, categories, products, faqs } = store;
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


      {offers.length > 0 && (
        <section className="sec" aria-labelledby="h-off">
          <div className="band">
            <div className="sec-head"><div><span className="eyebrow">Promoción</span><h2 id="h-off" style={{ marginTop: 6 }}>{d.promoTitle}</h2><p>{d.promoText}</p></div><Link href="/ofertas">Todas las ofertas <ArrowRight /></Link></div>
            <ProductGrid products={offers} ctx={ctx} rail />
          </div>
        </section>
      )}

      <section className="sec" id="personalizados" aria-labelledby="h-custom">
        <div className="brand-sec">
          <div className="bs-copy">
            <span className="h2-eyebrow">Regalos empresariales</span>
            <h2 id="h-custom">Tu marca,<br />en cada detalle.</h2>
            <p>Personalizamos tazas, vasos, tablas, utensilios y más con el logo de tu empresa. Ideal para regalos de fin de año, eventos, kits de bienvenida y merchandising.</p>
            <div className="bs-tech">
              <span><Zap />Grabado láser</span><span><Droplet />Sublimación</span><span><Layers />Serigrafía</span><span><Tag />Etiquetas</span>
            </div>
            <WaLink href={waLink(settings.whatsapp, msgCustom())} channel="custom" className="btn btn-cta btn-lg bs-cta">Pedir presupuesto con mi logo<ArrowRight /></WaLink>
          </div>
          <div className="bs-grid">
            {BRAND_WORKS.map((w) => {
              const p = products.find((x) => x.sku === w.sku);
              const body = (
                <>
                  <span className="bs-img"><Image src={w.img} alt={`${w.title} personalizados con logo`} fill sizes="(max-width: 860px) 50vw, 24vw" /></span>
                  <span className="bs-meta"><b>{w.title}</b><small className="mono">{w.sku}</small></span>
                  <span className="bs-pill">{w.tech}</span>
                </>
              );
              return p ? <Link key={w.sku} className="bs-card" href={`/producto/${p.slug}`}>{body}</Link> : <div key={w.sku} className="bs-card">{body}</div>;
            })}
          </div>
        </div>
        <ol className="bs-steps">
          <li><span className="n">1</span><CloudUpload aria-hidden /><span><b>Nos mandás tu logo</b>En PDF, AI o PNG en buena calidad, con la cantidad y los productos que te interesan.</span></li>
          <li><span className="n">2</span><FilePen aria-hidden /><span><b>Te enviamos boceto y presupuesto</b>Ves cómo queda antes de confirmar.</span></li>
          <li><span className="n">3</span><Package aria-hidden /><span><b>Producimos y enviamos</b>A tu oficina o a cualquier punto del país.</span></li>
        </ol>
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
