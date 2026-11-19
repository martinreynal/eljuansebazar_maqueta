import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogClient } from "@/components/CatalogClient";
import { CatalogSkeleton } from "@/components/CatalogSkeleton";
import { HomeSearch } from "@/components/HomeSearch";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
export const metadata: Metadata = {
  title: { absolute: "Saggio · Equipamiento profesional para la hospitalidad" },
  description: "Mobiliario, vajilla, cristalería y bazar para hoteles y restaurantes. Elegí Bazar o Mobiliario, encontrá la categoría y pedí tu cotización por WhatsApp.",
  alternates: { canonical: "/" },
};

/**
 * Portada = catálogo. Arriba, la presentación y los accesos Bazar / Mobiliario;
 * debajo no aparece nada hasta elegir un grupo (sus categorías) y una categoría (sus productos).
 */
export default async function Home() {
  const { products, categories, settings } = await getStore();
  return (
    <>
      <div className="wrap only-m"><div className="m-quick"><HomeSearch /></div></div>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogClient products={products} categories={categories} settings={settings} base={siteUrl(settings.site_url)} title="Catálogo" home />
      </Suspense>
    </>
  );
}
