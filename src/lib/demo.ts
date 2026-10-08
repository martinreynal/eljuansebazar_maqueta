// Datos de demostración (ficticios). Se usan solo si Supabase no está configurado.
import raw from "./demo-data.json";
import { slugify } from "./format";
import type { Availability, Category, CustomWork, Design, Faq, Product, StoreData, Tag } from "./types";

type RawProduct = (typeof raw.products)[number] & { oldPrice?: number };

export function demoStore(): StoreData {
  const categories: Category[] = raw.categories.map((c, i) => ({
    id: `demo-${c.id}`,
    slug: (c as { virtual?: boolean }).virtual ? "ofertas" : slugify(c.name),
    name: c.name,
    image_path: null,
    position: i,
    active: true,
    is_offers: Boolean((c as { virtual?: boolean }).virtual),
  }));
  const products: Product[] = (raw.products as RawProduct[]).map((p) => ({
    id: `demo-${p.sku}`,
    sku: p.sku,
    slug: slugify(p.name),
    name: p.name,
    category_id: `demo-${p.cat}`,
    description: p.desc,
    materials: p.materials,
    dimensions: p.dims,
    variants: p.variants,
    price: p.price,
    old_price: p.oldPrice ?? null,
    price_visible: true,
    availability: p.avail.replace("-", "_") as Availability,
    stock: p.stock,
    tag: p.tag as Tag,
    featured: p.featured,
    visible: true,
    archived: false,
    images: [],
    placeholder: { kind: p.kind, color: p.color, bg: p.bg },
    created_at: `${p.added}T12:00:00-03:00`,
  }));
  const faqs: Faq[] = raw.faq.map((f, i) => ({ id: `demo-faq-${i}`, question: f.q, answer: f.a, position: i }));
  const customWorks: CustomWork[] = raw.custom.map((c, i) => ({
    id: `demo-cw-${i}`,
    title: c.brand,
    technique: c.tech,
    quantity: c.qty,
    image_path: null,
    placeholder: c as CustomWork["placeholder"],
    position: i,
  }));
  return {
    settings: {
      business_name: raw.settings.name,
      tagline: "Bazar a medida",
      whatsapp: "5491126763257",
      hours: raw.settings.hours,
      instagram: raw.settings.instagram,
      facebook: raw.settings.facebook,
      site_url: "",
      show_prices: false,
      design: { notice: "Versión preliminar · productos e imágenes de demostración", ...raw.design } as Design,
    },
    categories,
    products,
    faqs,
    customWorks,
    demo: true,
  };
}
