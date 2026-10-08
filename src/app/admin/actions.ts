"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { serverClient } from "@/lib/supabase/server";

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; field?: string };

/** Invalida la tienda, el sitemap y el PDF para que los cambios se vean enseguida. */
function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/catalogo.pdf");
  revalidatePath("/sitemap.xml");
}

function fail(e: unknown): Result<never> {
  const err = e as { message?: string; code?: string; details?: string };
  if (err?.code === "23505") {
    if (/sku/.test(err.message ?? "") || /sku/.test(err.details ?? "")) return { ok: false, error: "Ya existe otro producto con este código SKU.", field: "sku" };
    if (/slug/.test(err.message ?? "") || /slug/.test(err.details ?? "")) return { ok: false, error: "Ya existe otro elemento con esa dirección (slug). Cambiá el nombre o el slug.", field: "slug" };
    return { ok: false, error: "Ya existe un registro con esos datos." };
  }
  if (err?.code === "23514") return { ok: false, error: "Algún dato no tiene el formato correcto. Revisá el formulario." };
  return { ok: false, error: err?.message || "No se pudo guardar. Probá de nuevo." };
}

function zodFail(e: z.ZodError): Result<never> {
  const i = e.issues[0];
  return { ok: false, error: i?.message ?? "Datos inválidos", field: i?.path?.[0]?.toString() };
}

const media = (sb: Awaited<ReturnType<typeof requireAdmin>>) => sb.storage.from("media");

// ---------------------------------------------------------------- productos

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(3, "El nombre necesita al menos 3 letras.").max(120),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/, "El SKU lleva entre 2 y 20 letras, números o guiones."),
  slug: z.string().trim().optional(),
  category_id: z.string().uuid("Elegí una categoría."),
  description: z.string().trim().max(3000).default(""),
  materials: z.string().trim().max(300).default(""),
  dimensions: z.string().trim().max(300).default(""),
  variants: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  price: z.number().nonnegative("El precio no puede ser negativo.").nullable(),
  old_price: z.number().nonnegative().nullable(),
  price_visible: z.boolean(),
  availability: z.enum(["disponible", "consultar", "sin_stock", "discontinuado"]),
  stock: z.number().int().nonnegative("El stock tiene que ser 0 o más.").nullable(),
  tag: z.enum(["", "nuevo", "oferta", "destacado"]),
  featured: z.boolean(),
  visible: z.boolean(),
  images: z.array(z.string().regex(/^products\/[\w.-]+$/)).max(10),
});
export type ProductInputT = z.input<typeof ProductInput>;

export async function saveProduct(input: ProductInputT): Promise<Result<{ id: string; slug: string }>> {
  const parsed = ProductInput.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const sb = await requireAdmin();
    const { id, ...v } = parsed.data;
    const slug = slugify(v.slug || v.name);
    if (!slug) return { ok: false, error: "No se pudo armar la dirección del producto. Revisá el nombre.", field: "name" };
    const row = { ...v, slug, archived: false };
    let removed: string[] = [];
    if (id) {
      const { data: prev } = await sb.from("products").select("images").eq("id", id).single();
      removed = ((prev?.images as string[]) ?? []).filter((x) => !v.images.includes(x));
      const { error } = await sb.from("products").update(row).eq("id", id);
      if (error) return fail(error);
    }
    const res = id
      ? { data: { id }, error: null }
      : await sb.from("products").insert(row).select("id").single();
    if (res.error) return fail(res.error);
    if (removed.length) await media(sb).remove(removed);
    refresh();
    return { ok: true, data: { id: res.data!.id as string, slug } };
  } catch (e) {
    return fail(e);
  }
}

const Flags = z.object({
  visible: z.boolean().optional(),
  featured: z.boolean().optional(),
  archived: z.boolean().optional(),
  availability: z.enum(["disponible", "consultar", "sin_stock", "discontinuado"]).optional(),
  stock: z.number().int().nonnegative().nullable().optional(),
});

export async function updateProductFlags(id: string, patch: z.input<typeof Flags>): Promise<Result> {
  const parsed = Flags.safeParse(patch);
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return { ok: false, error: "Datos inválidos." };
  try {
    const sb = await requireAdmin();
    const { error } = await sb.from("products").update(parsed.data).eq("id", id);
    if (error) return fail(error);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProduct(id: string): Promise<Result> {
  try {
    const sb = await requireAdmin();
    const { data } = await sb.from("products").select("images").eq("id", id).single();
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) return fail(error);
    const imgs = (data?.images as string[]) ?? [];
    if (imgs.length) await media(sb).remove(imgs);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- categorías

const CategoryInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "El nombre necesita al menos 2 letras.").max(60),
  active: z.boolean(),
  image_path: z.string().regex(/^categories\/[\w.-]+$/).nullable(),
});

export async function saveCategory(input: z.input<typeof CategoryInput>): Promise<Result<{ id: string }>> {
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const sb = await requireAdmin();
    const { id, ...v } = parsed.data;
    if (id) {
      const { data: prev } = await sb.from("categories").select("image_path, is_offers").eq("id", id).single();
      const patch = prev?.is_offers ? v : { ...v, slug: slugify(v.name) };
      const { error } = await sb.from("categories").update(patch).eq("id", id);
      if (error) return fail(error);
      if (prev?.image_path && prev.image_path !== v.image_path) await media(sb).remove([prev.image_path]);
      refresh();
      return { ok: true, data: { id } };
    }
    const { count } = await sb.from("categories").select("id", { count: "exact", head: true });
    const { data, error } = await sb.from("categories").insert({ ...v, slug: slugify(v.name), position: count ?? 0 }).select("id").single();
    if (error) return fail(error);
    refresh();
    return { ok: true, data: { id: data.id as string } };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderCategories(ids: string[]): Promise<Result> {
  try {
    const sb = await requireAdmin();
    for (const [i, id] of ids.entries()) {
      const { error } = await sb.from("categories").update({ position: i }).eq("id", id);
      if (error) return fail(error);
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategory(id: string): Promise<Result> {
  try {
    const sb = await requireAdmin();
    const { count } = await sb.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
    if (count) return { ok: false, error: `La categoría tiene ${count} producto${count === 1 ? "" : "s"}. Movelos a otra categoría antes de eliminarla.` };
    const { data } = await sb.from("categories").select("image_path, is_offers").eq("id", id).single();
    if (data?.is_offers) return { ok: false, error: "La categoría de ofertas no se puede eliminar. Podés desactivarla." };
    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) return fail(error);
    if (data?.image_path) await media(sb).remove([data.image_path]);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- diseño, FAQ y trabajos

const DesignInput = z.object({
  notice: z.string().trim().max(160),
  heroEyebrow: z.string().trim().max(60),
  heroTitle: z.string().trim().min(3, "El título del banner no puede quedar vacío.").max(120),
  heroText: z.string().trim().max(400),
  heroCta: z.string().trim().min(2).max(40),
  heroProducts: z.array(z.string()).max(3),
  promoTitle: z.string().trim().max(80),
  promoText: z.string().trim().max(300),
  waTitle: z.string().trim().max(80),
  waText: z.string().trim().max(300),
  customEyebrow: z.string().trim().max(60),
  customTitle: z.string().trim().max(120),
  customText: z.string().trim().max(400),
});

export async function saveDesign(input: z.input<typeof DesignInput>): Promise<Result> {
  const parsed = DesignInput.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const sb = await requireAdmin();
    const { error } = await sb.from("settings").update({ design: parsed.data }).eq("id", 1);
    if (error) return fail(error);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const FaqList = z.array(z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(3, "Cada pregunta necesita texto.").max(200),
  answer: z.string().trim().min(3, "Cada respuesta necesita texto.").max(2000),
})).max(40);

export async function saveFaqs(input: z.input<typeof FaqList>): Promise<Result> {
  const parsed = FaqList.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const sb = await requireAdmin();
    const keep = parsed.data.filter((f) => f.id).map((f) => f.id!) ;
    const del = keep.length
      ? await sb.from("faqs").delete().not("id", "in", `(${keep.join(",")})`)
      : await sb.from("faqs").delete().not("id", "is", null);
    if (del.error) return fail(del.error);
    for (const [i, f] of parsed.data.entries()) {
      const r = f.id
        ? await sb.from("faqs").update({ question: f.question, answer: f.answer, position: i }).eq("id", f.id)
        : await sb.from("faqs").insert({ question: f.question, answer: f.answer, position: i });
      if (r.error) return fail(r.error);
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const WorkList = z.array(z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Cada trabajo necesita un nombre (la marca o el cliente).").max(80),
  technique: z.string().trim().max(60),
  quantity: z.string().trim().max(30),
  image_path: z.string().regex(/^works\/[\w.-]+$/).nullable(),
})).max(12);

export async function saveCustomWorks(input: z.input<typeof WorkList>): Promise<Result> {
  const parsed = WorkList.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const sb = await requireAdmin();
    const { data: prev } = await sb.from("custom_works").select("id, image_path");
    const keep = new Set(parsed.data.filter((w) => w.id).map((w) => w.id));
    const usedImgs = new Set(parsed.data.map((w) => w.image_path).filter(Boolean));
    const orphan = (prev ?? []).map((w) => w.image_path as string | null).filter((p): p is string => !!p && !usedImgs.has(p));
    const gone = (prev ?? []).filter((w) => !keep.has(w.id as string)).map((w) => w.id as string);
    if (gone.length) {
      const { error } = await sb.from("custom_works").delete().in("id", gone);
      if (error) return fail(error);
    }
    for (const [i, w] of parsed.data.entries()) {
      const row = { title: w.title, technique: w.technique, quantity: w.quantity, image_path: w.image_path, position: i };
      const r = w.id ? await sb.from("custom_works").update(row).eq("id", w.id) : await sb.from("custom_works").insert(row);
      if (r.error) return fail(r.error);
    }
    if (orphan.length) await media(sb).remove(orphan);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- configuración

const SettingsInput = z.object({
  business_name: z.string().trim().min(2, "Escribí el nombre del negocio.").max(80),
  tagline: z.string().trim().max(60),
  whatsapp: z.string().transform((s) => s.replace(/\D/g, "")).pipe(z.string().regex(/^\d{10,15}$/, "El WhatsApp lleva entre 10 y 15 dígitos con código de país. Ej: 5491126763257")),
  hours: z.string().trim().max(120),
  instagram: z.string().trim().max(80),
  facebook: z.string().trim().max(80),
  site_url: z.string().trim().max(200).refine((s) => !s || /^https?:\/\/[^\s/]+\.[^\s]+$/.test(s), "La dirección del sitio tiene que empezar con https://"),
  show_prices: z.boolean(),
});

export async function saveSettings(input: z.input<typeof SettingsInput>): Promise<Result> {
  const parsed = SettingsInput.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  try {
    const sb = await requireAdmin();
    const { error } = await sb.from("settings").update({ ...parsed.data, site_url: parsed.data.site_url.replace(/\/$/, "") }).eq("id", 1);
    if (error) return fail(error);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- sesión

export async function signOut() {
  const sb = await serverClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}
