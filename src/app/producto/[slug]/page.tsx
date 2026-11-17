import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { ProductGrid } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { getStore } from "@/lib/data";
import { mediaUrl, siteUrl } from "@/lib/env";
import { shortDesc } from "@/lib/format";
import { groupOf } from "@/lib/groups";
import { subnavOfProduct } from "@/lib/subnav";
import { GeoEdges } from "@/components/Geo";

export const revalidate = 300;
type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { products } = await getStore();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getStore();
  const p = products.find((x) => x.slug === slug);
  if (!p) return { title: "Producto no disponible" };
  const img = mediaUrl(p.images[0]);
  return {
    title: `${p.name} (${p.sku})`,
    description: shortDesc(p, 155) || p.name,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { title: p.name, description: shortDesc(p, 155), images: img ? [img] : ["/og-image.png"] },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const { products, categories, settings } = await getStore();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const base = siteUrl(settings.site_url);
  const category = categories.find((c) => c.id === p.category_id);
  const group = category ? groupOf(category) : null;
  // Tipo dentro de la categoría (Platos, Bowls, Sillas de madera…) para la ruta y la ficha técnica
  const nav = subnavOfProduct(p, category?.slug);
  const typeKeys = nav ? nav.typesOf(p, category?.slug) : new Set<string>();
  const subT = nav?.types.find((t) => typeKeys.has(t.key));
  const subtype = nav && subT ? { label: subT.label, href: `/categoria/${nav.slug}?tipo=${subT.key}` } : null;
  const related = [...products.filter((x) => x.id !== p.id && x.category_id === p.category_id), ...products.filter((x) => x.id !== p.id && x.category_id !== p.category_id && x.tag && x.tag === p.tag)].slice(0, 4);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      sku: p.sku,
      description: p.description,
      material: p.materials || undefined,
      category: category?.name,
      image: p.images.map((i) => { const u = mediaUrl(i)!; return u.startsWith("/") ? `${base}${u}` : u; }),
      brand: { "@type": "Brand", name: settings.business_name },
      url: `${base}/producto/${p.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: base },
        { "@type": "ListItem", position: 2, name: "Catálogo", item: `${base}/catalogo` },
        ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${base}/categoria/${category.slug}` }] : []),
        { "@type": "ListItem", position: category ? 4 : 3, name: p.name },
      ],
    },
  ];
  return (
    <div className="pdx-page">
    <GeoEdges />
    <div className="wrap">
      <Link className="back-m only-m" href={category ? `/categoria/${category.slug}` : "/catalogo"}><ChevronLeft />{category ? category.name : "Catálogo"}</Link>
      <nav className="crumbs only-d" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link><span aria-hidden>›</span>
        {category ? <><Link href={`/categoria/${category.slug}`}>{category.name}</Link><span aria-hidden>›</span></> : <><Link href="/catalogo">Catálogo</Link><span aria-hidden>›</span></>}
        {subtype && <><Link href={subtype.href}>{subtype.label}</Link><span aria-hidden>›</span></>}
        <span aria-current="page">{p.name}</span>
      </nav>
      <ProductDetail p={p} category={category} group={group} subtype={subtype} settings={settings} base={base} />
      {related.length > 0 && (
        <section className="sec" aria-labelledby="h-rel">
          <div className="sec-head"><h2 id="h-rel">También te puede interesar</h2>{category && <Link href={`/categoria/${category.slug}`}>Más de {category.name} <ArrowRight /></Link>}</div>
          <ProductGrid products={related} ctx={{ settings, base, categories }} />
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </div>
    </div>
  );
}
