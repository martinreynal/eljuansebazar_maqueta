import type { Metadata } from "next";
import Link from "next/link";
import { ListClient } from "@/components/ListClient";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;
export const metadata: Metadata = { title: "Lista de consulta", robots: { index: false } };

export default async function ListPage() {
  const { products, settings } = await getStore();
  return (
    <div className="wrap" style={{ paddingBottom: 48 }}>
      <nav className="crumbs" aria-label="Ruta de navegación"><Link href="/">Inicio</Link><span aria-hidden>›</span><span aria-current="page">Lista de consulta</span></nav>
      <h1 className="page-title">Lista de consulta</h1>
      <ListClient products={products} settings={settings} base={siteUrl(settings.site_url)} />
    </div>
  );
}
