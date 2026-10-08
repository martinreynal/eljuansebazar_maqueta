export type Availability = "disponible" | "consultar" | "sin_stock" | "discontinuado";
export type Tag = "" | "nuevo" | "oferta" | "destacado";

/** Dibujo ilustrativo que se muestra mientras un producto no tiene fotos. */
export type Placeholder = { kind: string; color: string; bg: string };

export type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category_id: string | null;
  description: string;
  materials: string;
  dimensions: string;
  variants: string[];
  price: number | null;
  old_price: number | null;
  price_visible: boolean;
  availability: Availability;
  stock: number | null;
  tag: Tag;
  featured: boolean;
  visible: boolean;
  archived: boolean;
  images: string[];
  placeholder: Placeholder | null;
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  image_path: string | null;
  position: number;
  active: boolean;
  is_offers: boolean;
};

export type Design = {
  notice: string; // franja superior; vacía = oculta
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  heroCta: string;
  heroProducts: string[]; // SKUs
  promoTitle: string;
  promoText: string;
  waTitle: string;
  waText: string;
  customEyebrow: string;
  customTitle: string;
  customText: string;
};

export type Settings = {
  business_name: string;
  tagline: string;
  whatsapp: string;
  hours: string;
  instagram: string;
  facebook: string;
  site_url: string;
  show_prices: boolean;
  design: Design;
};

export type Faq = { id: string; question: string; answer: string; position: number };

export type CustomPlaceholder = {
  brand: string;
  mark: "circle" | "square" | "triangle" | "leaf";
  kind: string;
  color: string;
  bg: string;
  ink: string;
};

export type CustomWork = {
  id: string;
  title: string;
  technique: string;
  quantity: string;
  image_path: string | null;
  placeholder: CustomPlaceholder | null;
  position: number;
};

export type StoreData = {
  settings: Settings;
  categories: Category[];
  products: Product[];
  faqs: Faq[];
  customWorks: CustomWork[];
  demo: boolean;
};

export type EventType = "product_view" | "wa_click" | "category_view" | "list_send";
export type WaChannel = "product" | "list" | "general" | "custom" | "quote";
