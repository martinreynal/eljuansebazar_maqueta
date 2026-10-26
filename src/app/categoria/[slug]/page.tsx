import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogClient } from "@/components/CatalogClient";
import { CatalogSkeleton } from "@/components/CatalogSkeleton";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";
import { GROUPS, groupByKey } from "@/lib/groups";

export const revalidate = 300;
type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { categories } = await getStore();
  return [...GROUPS.map((g) => ({ slug: g.key })), ...categories.filter((c) => !c.is_offers).map((c) => ({ slug: c.slug }))];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const g = groupByKey(slug);
  if (g) return { title: g.name, description: `${g.name}: ${g.line.toLowerCase()} para restaurantes, bares, cafeterías y hoteles. Cotizaciones por WhatsApp.`, alternates: { canonical: `/categoria/${g.key}` } };
  const { categories } = await getStore();
  const c = categories.find((x) => x.slug === slug);
  if (!c) return {};
  return {
    title: c.name,
    description: `${c.name}: productos disponibles para cotizar por WhatsApp, con envíos a todo el país.`,
    alternates: { canonical: `/categoria/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const { products, categories, settings } = await getStore();
  const g = groupByKey(slug);
  if (g) {
    return (
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogClient key={g.key} products={products} categories={categories} settings={settings} base={siteUrl(settings.site_url)} group={g.key} title={g.name} />
      </Suspense>
    );
  }
  const c = categories.find((x) => x.slug === slug && !x.is_offers);
  if (!c) notFound();
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogClient key={c.id} products={products} categories={categories} settings={settings} base={siteUrl(settings.site_url)} preset={c.id} title={c.name} />
    </Suspense>
  );
}
