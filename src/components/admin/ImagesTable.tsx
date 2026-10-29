"use client";
/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, Check, ExternalLink, ImageUp, Loader2, ScanSearch, Search, Undo2, X } from "lucide-react";
import { lensSearch, setMainImage, type LensMatch } from "@/app/admin/actions";
import { searchable } from "@/lib/format";
import { mediaUrl } from "@/lib/env";
import { knownScore, measureScore, preScore, type ImageScore } from "@/lib/image-score";
import { uploadImage } from "@/lib/upload";
import { GROUPS, groupOf } from "@/lib/groups";
import type { Category, Product } from "@/lib/types";
import { ProductImage } from "../ProductImage";

type Sort = "peor" | "mejor" | "recientes";

/** Nota de definición 1–10 con color: rojo (mala) → verde (muy buena). */
function ScoreBadge({ path }: { path: string | undefined }) {
  const [s, setS] = useState<ImageScore | null>(() => (path ? preScore(path) : null));
  const [err, setErr] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!path) return;
    const known = knownScore(path);
    if (known) { setS(known); return; }
    setS(null);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      measureScore(mediaUrl(path)!, path).then(setS, () => setErr(true));
    });
    io.observe(el);
    return () => io.disconnect();
  }, [path]);
  if (!path) return <span className="score none">—</span>;
  if (!s) return <span ref={ref} className="score none">{err ? "?" : <Loader2 className="spin" />}</span>;
  const tone = s[2] >= 8 ? "hi" : s[2] >= 5 ? "mid" : s[2] >= 3 ? "lo" : "bad";
  return (
    <span className={`score ${tone}`} title={`${s[0]} × ${s[1]} px`}>
      <b>{s[2]}</b><small>/10</small>
      <em>{s[0]}×{s[1]}</em>
    </span>
  );
}

/** Enlace de Google Lens para la foto, con la dirección pública tomada del propio sitio. */
function lensLink(path: string | undefined): string | undefined {
  if (!path || typeof window === "undefined") return undefined;
  const url = new URL(mediaUrl(path)!, window.location.origin).href;
  return `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}&hl=es-419`;
}

type Compare = { p: Product; status: "buscando" | "listo" | "error" | "sin-clave"; matches: LensMatch[]; pick: number; error?: string; lensUrl?: string; manual?: string };

export function ImagesTable({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("peor");
  // Filtro por categoría: "" = todas, "g:bazar" / "g:mobiliario" = grupo completo, o el id de una categoría
  const [cat, setCat] = useState("");
  const realCats = useMemo(() => categories.filter((c) => !c.is_offers), [categories]);
  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const [cmp, setCmp] = useState<Compare | null>(null);
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string; undo?: { id: string; path: string } } | null>(null);
  const [override, setOverride] = useState<Record<string, string>>({});

  const rows = useMemo(() => {
    const w = searchable(q).split(" ").filter(Boolean);
    const list = products
      .filter((p) => !p.archived)
      .map((p) => (override[p.id] ? { ...p, images: [override[p.id], ...p.images.slice(1)] } : p))
      .filter((p) => {
        if (!cat) return true;
        if (cat === "nuevas") return !!p.staged;
        if (cat.startsWith("g:")) { const c = realCats.find((x) => x.id === p.category_id); return !!c && groupOf(c) === cat.slice(2); }
        return p.category_id === cat;
      })
      .filter((p) => !w.length || w.every((x) => searchable(`${p.name} ${p.sku}`).includes(x)));
    if (sort === "recientes") return list;
    const sc = (p: Product) => (p.images[0] ? preScore(p.images[0])?.[2] ?? 5.5 : 0);
    return [...list].sort((a, b) => (sort === "peor" ? sc(a) - sc(b) : sc(b) - sc(a)));
  }, [products, q, sort, override, cat, realCats]);

  const search = (p: Product) => {
    const lensUrl = lensLink(p.images[0]);
    setCmp({ p, status: "buscando", matches: [], pick: 0, lensUrl });
    start(async () => {
      const r = await lensSearch(p.id);
      if (r.ok) setCmp({ p, status: r.data!.matches.length ? "listo" : "error", matches: r.data!.matches, pick: 0, lensUrl, error: r.data!.matches.length ? undefined : "Google Lens no encontró imágenes parecidas." });
      else setCmp({ p, status: r.code === "no-key" ? "sin-clave" : "error", matches: [], pick: 0, error: r.code === "no-key" ? undefined : r.error, lensUrl });
    });
  };

  const chosen = (c: Compare): { image: string; width: number | null; height: number | null; link?: string; source?: string } | null =>
    c.manual ? { image: c.manual, width: null, height: null } : c.matches[c.pick] ?? null;

  const replace = async () => {
    if (!cmp) return;
    const m = chosen(cmp);
    if (!m) return;
    setBusy(true);
    try {
      const r = await fetch(`/admin/imagen-externa?url=${encodeURIComponent(m.image)}`);
      if (!r.ok) throw new Error((await r.text()) || "No se pudo descargar la imagen.");
      const blob = await r.blob();
      const path = await uploadImage(new File([blob], `${cmp.p.sku}.jpg`, { type: blob.type || "image/jpeg" }), "products");
      const res = await setMainImage(cmp.p.id, path);
      if (!res.ok) throw new Error(res.error);
      setOverride((o) => ({ ...o, [cmp.p.id]: path }));
      setMsg({ ok: true, text: `Se cambió la imagen de “${cmp.p.name}”.`, undo: res.data?.previous ? { id: cmp.p.id, path: res.data.previous } : undefined });
      setCmp(null);
      router.refresh();
    } catch (e) {
      setCmp({ ...cmp, error: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<Product | null>(null);
  const pickFile = (p: Product) => { target.current = p; fileRef.current?.click(); };
  const onFile = async (f: File | undefined) => {
    const p = target.current;
    if (fileRef.current) fileRef.current.value = "";
    if (!f || !p) return;
    setUploading(p.id);
    try {
      const path = await uploadImage(f, "products");
      const res = await setMainImage(p.id, path);
      if (!res.ok) throw new Error(res.error);
      setOverride((o) => ({ ...o, [p.id]: path }));
      setMsg({ ok: true, text: `Se cambió la imagen de “${p.name}”.`, undo: res.data?.previous ? { id: p.id, path: res.data.previous } : undefined });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setUploading(null);
    }
  };

  const undo = (u: { id: string; path: string }) =>
    start(async () => {
      const r = await setMainImage(u.id, u.path);
      if (r.ok) setOverride((o) => ({ ...o, [u.id]: u.path }));
      setMsg(r.ok ? { ok: true, text: "Se volvió a la imagen anterior." } : { ok: false, text: r.error });
      router.refresh();
    });

  const withImg = products.filter((p) => !p.archived && p.images.length);
  const low = withImg.filter((p) => (preScore(p.images[0])?.[2] ?? 10) <= 3).length;

  return (
    <>
      <div className="adm-h">
        <div><h2>Imágenes de los productos</h2><p>{withImg.length} productos con foto · {low} con definición baja (3 o menos)</p></div>
      </div>
      {msg && (
        <div className={`adm-msg ${msg.ok ? "ok" : "bad"}`} role="status" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <span>{msg.text}</span>
          {msg.undo && <button className="btn btn-ghost btn-sm" onClick={() => undo(msg.undo!)}><Undo2 />Deshacer</button>}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <div className="search" style={{ display: "flex", maxWidth: 380, flex: "1 1 240px" }}><Search aria-hidden /><input type="search" placeholder="Buscar por nombre o SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar productos" /></div>
        <select className="input" style={{ width: "auto", minWidth: 220, height: 42 }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Ver por categoría">
          <option value="">Todas las categorías</option>
          <option value="nuevas">Nuevas incorporaciones ({products.filter((p) => p.staged && !p.archived).length})</option>
          {GROUPS.map((g) => (
            <optgroup key={g.key} label={g.name}>
              <option value={`g:${g.key}`}>Todo {g.name.toLowerCase()}</option>
              {realCats.filter((c) => groupOf(c) === g.key).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          ))}
        </select>
        <span className="hint">{rows.length} producto{rows.length === 1 ? "" : "s"}</span>
        <div className="seg" role="group" aria-label="Ordenar">
          <button aria-pressed={sort === "peor"} onClick={() => setSort("peor")}>Peor definición primero</button>
          <button aria-pressed={sort === "mejor"} onClick={() => setSort("mejor")}>Mejor primero</button>
          <button aria-pressed={sort === "recientes"} onClick={() => setSort("recientes")}>Recientes</button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Producto</th><th>SKU</th><th>Definición</th><th>Búsqueda en Lens</th><th>Cambiar imagen</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={p.visible ? "" : "muted"}>
                <td><div className="pt"><span className="t"><ProductImage p={p} view={0} label={false} sizes="42px" /></span><span>{p.name}{!cat || cat === "nuevas" || cat.startsWith("g:") ? <small className="hint" style={{ display: "block" }}>{catName.get(p.category_id ?? "") ?? "Sin categoría"}</small> : null}</span></div></td>
                <td className="mono">{p.sku}</td>
                <td><ScoreBadge path={p.images[0]} /></td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm lens-btn" disabled={!p.images.length || (cmp?.p.id === p.id && cmp.status === "buscando")} onClick={() => search(p)}>
                    {cmp?.p.id === p.id && cmp.status === "buscando" ? <Loader2 className="spin" /> : <ScanSearch />}Búsqueda en Lens
                  </button>
                </td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm lens-btn" disabled={uploading !== null} onClick={() => pickFile(p)}>
                    {uploading === p.id ? <Loader2 className="spin" /> : <ImageUp />}{uploading === p.id ? "Subiendo…" : "Cambiar imagen"}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No hay productos que coincidan con la búsqueda.</td></tr>}
          </tbody>
        </table>
      </div>

      {cmp && (
        <div className="lens-bg" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setCmp(null); }}>
          <div className="lens-modal" role="dialog" aria-modal="true" aria-label={`Búsqueda en Lens: ${cmp.p.name}`}>
            <div className="lens-head">
              <div><small className="mono">{cmp.p.sku}</small><h3>{cmp.p.name}</h3></div>
              <button className="icon-btn" aria-label="Cerrar" disabled={busy} onClick={() => setCmp(null)}><X /></button>
            </div>

            {cmp.status === "buscando" && <div className="lens-wait"><Loader2 className="spin" />Buscando imágenes parecidas en Google Lens…</div>}

            {cmp.status === "sin-clave" && (
              <div className="lens-note">
                <p><b>La búsqueda automática todavía no está activada.</b> Falta cargar la clave de SerpApi (variable <code>SERPAPI_KEY</code> en Vercel).</p>
                <p>Mientras tanto podés abrir la imagen en Google Lens, copiar la dirección de la imagen que te guste y pegarla acá abajo para compararla.</p>
                {cmp.lensUrl && <a className="btn btn-ghost btn-sm" href={cmp.lensUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />Abrir en Google Lens</a>}
              </div>
            )}

            {(cmp.status === "listo" || cmp.status === "sin-clave" || cmp.status === "error") && (
              <>
                {cmp.status === "error" && cmp.error && !cmp.manual && <div className="adm-msg bad">{cmp.error}</div>}
                <div className="lens-compare">
                  <figure>
                    <figcaption>Imagen actual</figcaption>
                    <div className="lens-img"><img src={mediaUrl(cmp.p.images[0])!} alt="Imagen actual" /></div>
                    <ScoreBadge path={cmp.p.images[0]} />
                  </figure>
                  <ArrowRight className="lens-arrow" aria-hidden />
                  <figure>
                    <figcaption>{cmp.manual ? "Imagen elegida" : "Mejor resultado"}</figcaption>
                    <div className="lens-img">{chosen(cmp) ? <img src={chosen(cmp)!.image} alt="Resultado de Google Lens" referrerPolicy="no-referrer" /> : <span className="hint">Sin imagen para comparar</span>}</div>
                    {chosen(cmp) && (
                      <div className="lens-meta">
                        {chosen(cmp)!.width ? <span className="score hi"><em>{chosen(cmp)!.width}×{chosen(cmp)!.height} px</em></span> : null}
                        {chosen(cmp)!.link && <a href={chosen(cmp)!.link} target="_blank" rel="noopener noreferrer">{chosen(cmp)!.source || "Ver origen"} <ExternalLink /></a>}
                      </div>
                    )}
                  </figure>
                </div>

                {cmp.matches.length > 1 && (
                  <div className="lens-thumbs" role="listbox" aria-label="Otros resultados">
                    {cmp.matches.map((m, i) => (
                      <button key={m.image + i} role="option" aria-selected={!cmp.manual && i === cmp.pick} onClick={() => setCmp({ ...cmp, pick: i, manual: undefined, error: undefined })} title={`${m.source}${m.width ? ` · ${m.width}×${m.height}` : ""}`}>
                        <img src={m.thumbnail} alt="" referrerPolicy="no-referrer" loading="lazy" />
                        {m.width && <small>{m.width}px</small>}
                      </button>
                    ))}
                  </div>
                )}

                <form className="lens-manual" onSubmit={(e) => { e.preventDefault(); const v = (new FormData(e.currentTarget).get("u") as string).trim(); if (/^https:\/\//.test(v)) setCmp({ ...cmp, manual: v, error: undefined }); }}>
                  <input name="u" type="url" placeholder="…o pegá la dirección (https://) de otra imagen" aria-label="Dirección de una imagen" />
                  <button className="btn btn-ghost btn-sm" type="submit">Comparar</button>
                </form>

                {cmp.error && (cmp.manual || cmp.status === "listo") && <div className="adm-msg bad">{cmp.error}</div>}
                <div className="lens-actions">
                  {cmp.lensUrl && cmp.status !== "sin-clave" && <a className="btn btn-ghost" href={cmp.lensUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />Ver en Google Lens</a>}
                  <button className="btn btn-ghost" disabled={busy} onClick={() => setCmp(null)}>Cancelar</button>
                  <button className="btn btn-dark" disabled={busy || !chosen(cmp)} onClick={replace}>{busy ? <Loader2 className="spin" /> : <Check />}Usar la imagen nueva</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
