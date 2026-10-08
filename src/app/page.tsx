import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Clock, Droplet, FileDown, ListPlus, MessageCircle, Search, Stamp, Tag, Truck, Zap } from "lucide-react";
import { CustomArt } from "@/components/Art";
import { ProductGrid } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { WaLink } from "@/components/WaLink";
import { getStore, getTopProductIds } from "@/lib/data";
import { mediaUrl, siteUrl } from "@/lib/env";
import { inCategory, msgCustom, msgGeneral, msgQuote, waLink } from "@/lib/format";
import Image from "next/image";

export const revalidate = 300;

export default async function Home() {
  const store = await getStore();
  const { settings, categories, products, faqs, customWorks } = store;
  const d = settings.design;
  const base = siteUrl(settings.site_url);
  const ctx = { settings, base, categories };
  const bySku = new Map(products.map((p) => [p.sku, p]));
  const heroP = d.heroProducts.map((s) => bySku.get(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  while (heroP.length < 3 && products[heroP.length]) heroP.push(products.find((p) => !heroP.includes(p))!);
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
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{d.heroEyebrow}</span>
          <h1>{d.heroTitle}</h1>
          <p>{d.heroText}</p>
          <div className="hero-ctas">
            <Link className="btn btn-dark btn-lg" href="/catalogo">{d.heroCta}<ArrowRight /></Link>
            <WaLink href={waLink(settings.whatsapp, msgQuote(settings.business_name))} channel="quote" className="btn btn-ghost btn-lg">Pedir cotización</WaLink>
          </div>
          <div className="hero-facts">
            <div><MessageCircle />Atención por WhatsApp</div>
            <div><Truck />Envíos a todo el país</div>
            {settings.hours && <div><Clock />{settings.hours.split("·")[0].trim()}</div>}
          </div>
        </div>
        <div className="hero-art">
          {heroP.slice(0, 3).map((p, i) => (
            <Link key={p.id} href={`/producto/${p.slug}`} aria-label={p.name}>
              <ProductImage p={p} view={i === 0 ? 2 : 0} label={false} sizes={i === 0 ? "(max-width: 860px) 60vw, 30vw" : "(max-width: 860px) 40vw, 20vw"} priority />
              {i === 0 && <span className="cap">{p.name} <ArrowUpRight /></span>}
            </Link>
          ))}
        </div>
      </section>

      <section className="sec" aria-labelledby="h-cats">
        <div className="sec-head">
          <div><h2 id="h-cats">Explorá por categoría</h2></div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/catalogo.pdf" target="_blank" rel="noopener"><FileDown /> Catálogo PDF</a>
            <Link href="/catalogo">Todo el catálogo <ArrowRight /></Link>
          </div>
        </div>
        <div className="cat-grid">
          {realCats.map((c) => {
            const n = products.filter((p) => inCategory(p, c)).length;
            const cover = products.find((p) => p.category_id === c.id);
            const img = mediaUrl(c.image_path);
            return (
              <Link key={c.id} className="cat-tile" href={`/categoria/${c.slug}`}>
                <div className="ph">
                  {img ? <span className="media-fill"><Image src={img} alt="" fill sizes="(max-width: 560px) 33vw, 14vw" /></span> : cover ? <ProductImage p={cover} view={1} label={false} sizes="(max-width: 560px) 33vw, 14vw" /> : null}
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
          <ProductGrid products={featured} ctx={ctx} />
        </section>
      )}

      {offers.length > 0 && (
        <section className="sec" aria-labelledby="h-off">
          <div className="band">
            <div className="sec-head"><div><span className="eyebrow">Promoción</span><h2 id="h-off" style={{ marginTop: 6 }}>{d.promoTitle}</h2><p>{d.promoText}</p></div><Link href="/ofertas">Todas las ofertas <ArrowRight /></Link></div>
            <ProductGrid products={offers} ctx={ctx} />
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
                      {img ? <span className="media-fill"><Image src={img} alt={w.title} fill sizes="(max-width: 860px) 50vw, 25vw" /></span> : w.placeholder ? <CustomArt ph={w.placeholder} /> : null}
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
        <div className="sec-head"><div><h2 id="h-new">Recién llegados</h2><p>Lo último que entró al bazar.</p></div><Link href="/catalogo">Ver novedades <ArrowRight /></Link></div>
        <ProductGrid products={fresh} ctx={ctx} />
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
