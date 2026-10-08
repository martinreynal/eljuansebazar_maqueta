"use client";
import { browserClient } from "./supabase/browser";

/**
 * Achica la foto (máx. 1600 px), la convierte a JPEG y la sube al bucket "media".
 * Devuelve la ruta guardada (ej. "products/abc.jpg").
 */
export async function uploadImage(file: File, folder: "products" | "categories" | "works"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" no es una imagen.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`"${file.name}" pesa más de 25 MB.`);
  const blob = await toJpeg(file, 1600, 0.85);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await browserClient().storage.from("media").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`No se pudo subir "${file.name}": ${error.message}`);
  return path;
}

async function toJpeg(file: File, max: number, quality: number): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => {
    throw new Error(`No se pudo leer "${file.name}". Probá con una foto JPG o PNG.`);
  });
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen."))), "image/jpeg", quality));
}
