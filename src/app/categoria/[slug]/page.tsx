import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogClient } from "@/components/CatalogClient";
import { CatalogSkeleton } from "@/components/CatalogSkeleton";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { categories } = await getStore();
  return categories.filter((c) => !c.is_offers).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getStore();
  const c = categories.find((x) => x.slug === slug);
  if (!c) return {};
  return {
    title: c.name,
    description: `${c.name}: productos de bazar disponibles para cotizar por WhatsApp, con envíos a todo el país.`,
    alternates: { canonical: `/categoria/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const { products, categories, settings } = await getStore();
  const c = categories.find((x) => x.slug === slug && !x.is_offers);
  if (!c) notFound();
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogClient key={c.id} products={products} categories={categories} settings={settings} base={siteUrl(settings.site_url)} preset={c.id} title={c.name} />
    </Suspense>
  );
}
