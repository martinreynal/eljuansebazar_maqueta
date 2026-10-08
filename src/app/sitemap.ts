import type { MetadataRoute } from "next";
import { getStore } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories, settings } = await getStore();
  const base = siteUrl(settings.site_url);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/ofertas`, changeFrequency: "weekly", priority: 0.6 },
    ...categories.filter((c) => !c.is_offers).map((c) => ({ url: `${base}/categoria/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/producto/${p.slug}`, lastModified: new Date(p.created_at), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
