"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArrowLeft, Check, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { deleteProduct, saveProduct, updateProductFlags, type ProductInputT } from "@/app/admin/actions";
import { AVAILABILITY, TAGS, slugify } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";

const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(/\./g, "").replace(",", ".")));

export function ProductForm({ product, categories }: { product: Product | null; categories: Category[] }) {
  const router = useRouter();
  const p = product;
  const [f, setF] = useState({
    name: p?.name ?? "", sku: p?.sku ?? "", slug: p?.slug ?? "", category_id: p?.category_id ?? categories.find((c) => !c.is_offers)?.id ?? "",
    description: p?.description ?? "", materials: p?.materials ?? "", dimensions: p?.dimensions ?? "", variants: (p?.variants ?? []).join(", "),
    price: p?.price != null ? String(p.price) : "", old_price: p?.old_price != null ? String(p.old_price) : "",
    price_visible: p?.price_visible ?? true, availability: p?.availability ?? "disponible", stock: p?.stock != null ? String(p.stock) : "",
    tag: p?.tag ?? "", featured: p?.featured ?? false, visible: p?.visible ?? true, images: p?.images ?? [],
  });
  const [err, setErr] = useState<{ text: string; field?: string } | null>(null);
  const [ok, setOk] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setOk(""); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const price = num(f.price), old = num(f.old_price), stock = num(f.stock);
    if (Number.isNaN(price)) return setErr({ text: "El precio tiene que ser un número.", field: "price" });
    if (Number.isNaN(stock) || (stock != null && !Number.isInteger(stock))) return setErr({ text: "El stock tiene que ser un número entero.", field: "stock" });
    const input: ProductInputT = {
      id: p?.id, name: f.name, sku: f.sku, slug: f.slug || undefined, category_id: f.category_id, description: f.description, materials: f.materials,
      dimensions: f.dimensions, variants: f.variants.split(",").map((s) => s.trim()).filter(Boolean), price, old_price: Number.isNaN(old) ? null : old,
      price_visible: f.price_visible, availability: f.availability, stock, tag: f.tag, featured: f.featured, visible: f.visible, images: f.images,
    };
    start(async () => {
      const r = await saveProduct(input);
      if (!r.ok) return setErr({ text: r.error, field: r.field });
      setOk(p ? "Cambios guardados. Ya se ven en la tienda." : "Producto creado.");
      if (!p && r.data) router.replace(`/admin/productos/${r.data.id}`);
      else router.refresh();
    });
  };

  const fieldErr = (k: string) => (err?.field === k ? <span className="err">{err.text}</span> : null);
  const inputCls = (k: string) => `input${err?.field === k ? " invalid" : ""}`;

  return (
    <form onSubmit={submit} noValidate>
      <div className="adm-h">
        <div>
          <Link href="/admin/productos" className="link-btn" style={{ fontSize: 13, display: "inline-flex", gap: 4, alignItems: "center" }}><ArrowLeft style={{ width: 14 }} />Productos</Link>
          <h2 style={{ marginTop: 6 }}>{p ? p.name : "Nuevo producto"}</h2>
        </div>
        {p && p.visible && !p.archived && <Link className="btn btn-ghost btn-sm" href={`/producto/${p.slug}`} target="_blank"><ExternalLink />Ver en la tienda</Link>}
      </div>
      {err && !err.field && <div className="adm-msg bad" role="alert">{err.text}</div>}
      {ok && <div className="adm-msg ok" role="status">{ok}</div>}

      <div className="panel">
        <h3>Datos principales</h3>
        <div className="form-grid">
          <div className="field full"><label htmlFor="pf-name">Nombre *</label><input className={inputCls("name")} id="pf-name" value={f.name} onChange={(e) => set("name", e.target.value)} />{fieldErr("name")}</div>
          <div className="field"><label htmlFor="pf-sku">Código SKU *</label><input className={`${inputCls("sku")} mono`} id="pf-sku" value={f.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="Ej: V001" />{fieldErr("sku")}</div>
          <div className="field"><label htmlFor="pf-cat">Categoría *</label><select className={inputCls("category_id")} id="pf-cat" value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>{categories.filter((c) => !c.is_offers).map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (inactiva)"}</option>)}</select>{fieldErr("category_id")}</div>
          <div className="field full"><label htmlFor="pf-desc">Descripción</label><textarea className="input" id="pf-desc" rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} /><span className="hint">La primera oración se usa como descripción corta en las tarjetas.</span></div>
          <div className="field"><label htmlFor="pf-mat">Materiales</label><input className="input" id="pf-mat" value={f.materials} onChange={(e) => set("materials", e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-dim">Dimensiones</label><input className="input" id="pf-dim" value={f.dimensions} onChange={(e) => set("dimensions", e.target.value)} /></div>
          <div className="field full"><label htmlFor="pf-var">Colores o variantes</label><input className="input" id="pf-var" value={f.variants} onChange={(e) => set("variants", e.target.value)} placeholder="Ej: Blanco, Gris, Negro" /><span className="hint">Separadas por coma.</span></div>
        </div>
      </div>

      <div className="panel">
        <ImageUploader value={f.images} onChange={(v) => set("images", v)} folder="products" />
        {!f.images.length && <p className="hint" style={{ marginTop: 8 }}>Mientras no tenga fotos, la tienda muestra un dibujo ilustrativo.</p>}
      </div>

      <div className="panel">
        <h3>Precio, estado y etiquetas</h3>
        <div className="form-grid">
          <div className="field"><label htmlFor="pf-price">Precio (ARS)</label><input className={inputCls("price")} id="pf-price" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="Opcional" />{fieldErr("price")}</div>
          <div className="field"><label htmlFor="pf-old">Precio anterior (ofertas)</label><input className="input" id="pf-old" inputMode="decimal" value={f.old_price} onChange={(e) => set("old_price", e.target.value)} placeholder="Opcional" /></div>
          <div className="field"><label htmlFor="pf-av">Disponibilidad</label><select className="input" id="pf-av" value={f.availability} onChange={(e) => set("availability", e.target.value as typeof f.availability)}>{Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="field"><label htmlFor="pf-stock">Stock (opcional)</label><input className={inputCls("stock")} id="pf-stock" inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} />{fieldErr("stock")}</div>
          <div className="field"><label htmlFor="pf-tag">Etiqueta</label><select className="input" id="pf-tag" value={f.tag} onChange={(e) => set("tag", e.target.value as typeof f.tag)}>{Object.entries(TAGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="field"><label htmlFor="pf-slug">Dirección en la web</label><input className={inputCls("slug")} id="pf-slug" value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(f.name) || "se-arma-con-el-nombre"} />{fieldErr("slug")}<span className="hint">/producto/{f.slug || slugify(f.name) || "…"}</span></div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="row-inline"><span>Visible en la tienda</span><label className="switch"><input type="checkbox" checked={f.visible} onChange={(e) => set("visible", e.target.checked)} /><span /></label></div>
          <div className="row-inline"><span>Destacado en la portada</span><label className="switch"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /><span /></label></div>
          <div className="row-inline"><div><span>Mostrar el precio de este producto</span><p className="hint">Solo se ve si además está activado “Mostrar precios” en Configuración.</p></div><label className="switch"><input type="checkbox" checked={f.price_visible} onChange={(e) => set("price_visible", e.target.checked)} /><span /></label></div>
        </div>
      </div>

      {p && (
        <div className="panel">
          <h3>Archivar o eliminar</h3>
          <p className="hint" style={{ marginBottom: 10 }}>Archivar lo saca de la tienda pero lo conserva para reactivarlo después. Eliminar lo borra para siempre, con sus fotos.</p>
          {!confirmDel ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => start(async () => { const r = await updateProductFlags(p.id, { archived: !p.archived, visible: p.archived }); if (r.ok) router.push("/admin/productos"); else setErr({ text: r.error }); })}><Archive />{p.archived ? "Desarchivar" : "Archivar"}</button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--bad)" }} onClick={() => setConfirmDel(true)}><Trash2 />Eliminar</button>
            </div>
          ) : (
            <div className="confirm">
              <span>¿Eliminar <b>{p.name}</b> para siempre? Esta acción no se puede deshacer.</span>
              <div>
                <button type="button" className="btn btn-sm" style={{ background: "var(--bad)", color: "var(--surface)" }} disabled={pending} onClick={() => start(async () => { const r = await deleteProduct(p.id); if (r.ok) router.push("/admin/productos"); else setErr({ text: r.error }); })}>Eliminar</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="sticky-save">
        {err?.field && <span className="err" style={{ marginRight: "auto" }}>Revisá los campos marcados.</span>}
        <Link className="btn btn-ghost" href="/admin/productos">Cancelar</Link>
        <button className="btn btn-dark" type="submit" disabled={pending}>{pending ? <Loader2 className="spin" /> : <Check />}{p ? "Guardar cambios" : "Crear producto"}</button>
      </div>
    </form>
  );
}
