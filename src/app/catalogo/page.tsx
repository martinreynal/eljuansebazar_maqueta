import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogClient } from "@/components/CatalogClient";
import { CatalogSkeleton } from "@/components/CatalogSkeleton";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Catálogo",
  description: "Todos los productos del bazar: cocina, vajilla, decoración, organización, baño, limpieza y hogar. Buscá por SKU o palabra clave y pedí tu cotización por WhatsApp.",
  alternates: { canonical: "/catalogo" },
};

export default async function CatalogPage() {
  const { products, categories, settings } = await getStore();
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogClient products={products} categories={categories} settings={settings} base={siteUrl(settings.site_url)} title="Catálogo" />
    </Suspense>
  );
}
