import type { Metadata } from "next";
import Link from "next/link";
import { FavsClient } from "@/components/FavsClient";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default async function FavsPage() {
  const { products, categories, settings } = await getStore();
  return (
    <div className="wrap" style={{ paddingBottom: 48 }}>
      <nav className="crumbs" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span aria-hidden>›</span><span aria-current="page">Favoritos</span></nav>
      <h1 className="page-title">Favoritos</h1>
      <FavsClient products={products} categories={categories} settings={settings} base={siteUrl(settings.site_url)} />
    </div>
  );
}
