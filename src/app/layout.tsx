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

const manrope = localFont({
  variable: "--font-manrope",
  display: "swap",
  src: [
    { path: "../fonts/manrope-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/manrope-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/manrope-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/manrope-latin-800-normal.woff2", weight: "800" },
  ],
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
    icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1917" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories } = await getStore();
  return (
    <html lang="es-AR" className={`${manrope.variable} ${dmMono.variable}`}>
      <body>
        <StoreProvider>
          {settings.design.notice && <div className="demo-strip">{settings.design.notice}</div>}
          <Suspense fallback={<header className="hdr"><div className="wrap hdr-in" /></header>}>
            <Header
              name={settings.business_name}
              tagline={settings.tagline}
              whatsapp={settings.whatsapp}
              categories={categories.map(({ id, slug, name, is_offers }) => ({ id, slug, name, is_offers }))}
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
