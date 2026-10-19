"use client";
import scores from "./image-scores.json";

/** [ancho, alto, puntaje 1–10] */
export type ImageScore = [number, number, number];
const PRE = scores as unknown as Record<string, ImageScore>;
const KEY = "saggio:img-score:v1";

function cacheGet(path: string): ImageScore | null {
  try { return (JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, ImageScore>)[path] ?? null; } catch { return null; }
}
function cacheSet(path: string, s: ImageScore) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, ImageScore>;
    all[path] = s;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* sin almacenamiento: se recalcula la próxima vez */ }
}

/** Puntaje precalculado de las fotos del catálogo (igual en servidor y navegador). */
export const preScore = (path: string): ImageScore | null => PRE[path] ?? null;

/** Puntaje ya conocido (fotos del catálogo precalculadas o fotos medidas antes en este navegador). */
export const knownScore = (path: string): ImageScore | null => PRE[path] ?? cacheGet(path);

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("No se pudo leer la imagen"));
    img.src = url;
  });
}

/**
 * Mide la definición de una imagen (mismo cálculo que scripts/puntaje-imagenes.py):
 * tamaño real del producto dentro de la foto × cuánto detalle fino conserva.
 */
export async function measureScore(url: string, cacheKey?: string): Promise<ImageScore> {
  const img = await loadImage(url);
  const W = img.naturalWidth, H = img.naturalHeight;
  const k = Math.min(1, 1600 / Math.max(W, H));
  const w0 = Math.max(1, Math.round(W * k)), h0 = Math.max(1, Math.round(H * k));
  const c = document.createElement("canvas");
  c.width = w0; c.height = h0;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w0, h0);
  ctx.drawImage(img, 0, 0, w0, h0);
  const d = ctx.getImageData(0, 0, w0, h0).data;
  const xs: number[] = [], ys: number[] = [];
  for (let y = 0; y < h0; y += 2) for (let x = 0; x < w0; x += 2) {
    const i = (y * w0 + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
    const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
    if (mn < 235 || mx - mn > 25) { xs.push(x); ys.push(y); }
  }
  let s = 1;
  if (xs.length > 25) {
    const pct = (a: number[], p: number) => { const t = [...a].sort((m, n) => m - n); return t[Math.min(t.length - 1, Math.floor((p / 100) * t.length))]; };
    const x0 = pct(xs, 1), x1 = pct(xs, 99), y0 = pct(ys, 1), y1 = pct(ys, 99);
    const bw = Math.max(2, x1 - x0 + 1), bh = Math.max(2, y1 - y0 + 1);
    const crop = ctx.getImageData(x0, y0, bw, bh);
    const half = document.createElement("canvas");
    half.width = Math.max(1, bw >> 1); half.height = Math.max(1, bh >> 1);
    const src = document.createElement("canvas"); src.width = bw; src.height = bh;
    src.getContext("2d")!.putImageData(crop, 0, 0);
    const hc = half.getContext("2d")!; hc.imageSmoothingQuality = "low"; hc.drawImage(src, 0, 0, half.width, half.height);
    const back = document.createElement("canvas"); back.width = bw; back.height = bh;
    const bc = back.getContext("2d", { willReadFrequently: true })!; bc.imageSmoothingQuality = "low"; bc.drawImage(half, 0, 0, bw, bh);
    const a = crop.data, bb = bc.getImageData(0, 0, bw, bh).data;
    let sum = 0;
    for (let i = 0; i < a.length; i += 4) {
      const l1 = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
      const l2 = 0.299 * bb[i] + 0.587 * bb[i + 1] + 0.114 * bb[i + 2];
      sum += Math.abs(l1 - l2);
    }
    const det = sum / (a.length / 4);
    const eff = (Math.max(bw, bh) / k) * Math.max(0.45, Math.min(1, det / 2.5));
    s = Math.min(10, Math.max(1, Math.round(1 + (9 * (eff - 150)) / 1050)));
  }
  const out: ImageScore = [W, H, s];
  if (cacheKey) cacheSet(cacheKey, out);
  return out;
}
