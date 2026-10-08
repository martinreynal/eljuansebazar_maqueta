import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogClient } from "@/components/CatalogClient";
import { CatalogSkeleton } from "@/components/CatalogSkeleton";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
export const metadata: Metadata = { title: "Ofertas", alternates: { canonical: "/ofertas" } };

export default async function OffersPage() {
  const { products, categories, settings } = await getStore();
  const offers = categories.find((c) => c.is_offers);
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogClient products={products} categories={categories} settings={settings} base={siteUrl(settings.site_url)} preset={offers?.id} title={offers?.name ?? "Ofertas"} />
    </Suspense>
  );
}
