import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { Chrome } from "@/components/Chrome";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/components/store/StoreProvider";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const dmSans = localFont({
  variable: "--font-dm-sans",
  display: "swap",
  src: [{ path: "../fonts/dm-sans-latin-opsz-normal.woff2", weight: "100 1000", style: "normal" }],
});
const fraunces = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [{ path: "../fonts/fraunces-latin-full-normal.woff2", weight: "100 900", style: "normal" }],
});
const dmMono = localFont({
  variable: "--font-dm-mono",
  display: "swap",
  src: [
    { path: "../fonts/dm-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/dm-mono-latin-500-normal.woff2", weight: "500" },
  ],
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getStore();
  const base = siteUrl(settings.site_url);
  const title = `${settings.business_name} · ${settings.tagline}`;
  const description = "Vajilla, cocina, organización, deco y artículos para el hogar, con opción de personalización con logo. Cotizaciones por WhatsApp y envíos a todo el país.";
  return {
    metadataBase: new URL(base),
    title: { default: title, template: `%s | ${settings.business_name}` },
    description,
    openGraph: { type: "website", locale: "es_AR", siteName: settings.business_name, title, description, images: ["/og-image.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icono-saggio.png", type: "image/png", sizes: "512x512" }], shortcut: "/favicon.ico", apple: "/apple-icon-saggio.png" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#F4EFE7",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories, products } = await getStore();
  const hasOffers = products.some((p) => p.tag === "oferta");
  return (
    <html lang="es-AR" className={`${dmSans.variable} ${fraunces.variable} ${dmMono.variable}`}>
      <body>
        <StoreProvider>
          {settings.design.notice && <div className="demo-strip">{settings.design.notice}</div>}
          <Suspense fallback={<header className="hdr"><div className="wrap hdr-in" /></header>}>
            <Header
              name={settings.business_name}
              tagline={settings.tagline}
              whatsapp={settings.whatsapp}
              categories={categories.filter((c) => hasOffers || !c.is_offers).map(({ id, slug, name, is_offers, grupo }) => ({ id, slug, name, is_offers, grupo }))}
            />
          </Suspense>
          <main id="main">{children}</main>
          <Footer settings={settings} categories={categories} />
          <Chrome name={settings.business_name} whatsapp={settings.whatsapp} />
        </StoreProvider>
      </body>
    </html>
  );
}
