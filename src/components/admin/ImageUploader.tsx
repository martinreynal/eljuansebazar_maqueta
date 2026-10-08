"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import { mediaUrl } from "@/lib/env";
import { uploadImage } from "@/lib/upload";

/** Lista de imágenes con subida, orden (la primera es la principal) y borrado. */
export function ImageUploader({ value, onChange, folder, max = 10, label = "Imágenes" }: {
  value: string[]; onChange: (v: string[]) => void; folder: "products" | "categories" | "works"; max?: number; label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const list = [...files].slice(0, Math.max(0, max - value.length));
    if (!list.length) return setError(`Podés cargar hasta ${max} imagen${max === 1 ? "" : "es"}.`);
    setBusy(list.length);
    const done: string[] = [];
    for (const f of list) {
      try { done.push(await uploadImage(f, folder)); }
      catch (e) { setError((e as Error).message); }
      setBusy((b) => b - 1);
    }
    onChange([...value, ...done]);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="img-drop">
      <b style={{ fontSize: 13 }}>{label}</b>
      {value.length > 0 && (
        <div className="img-list">
          {value.map((p, i) => (
            <div key={p}>
              <Image src={mediaUrl(p)!} alt={`Imagen ${i + 1}`} width={64} height={64} />
              {i === 0 && max > 1 && <span className="first">Principal</span>}
              <button type="button" className="rm" onClick={() => onChange(value.filter((x) => x !== p))} aria-label={`Quitar imagen ${i + 1}`}><X /></button>
              {i > 0 && <button type="button" className="rm" style={{ right: "auto", left: 2, top: 2 }} onClick={() => { const v = [...value]; [v[i - 1], v[i]] = [v[i], v[i - 1]]; onChange(v); }} aria-label={`Mover imagen ${i + 1} antes`}><ArrowLeft /></button>}
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <label className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}>
          {busy ? <Loader2 className="spin" /> : <ImagePlus />}{busy ? `Subiendo ${busy}…` : "Subir fotos"}
          <input ref={input} type="file" accept="image/*" multiple={max > 1} hidden onChange={(e) => add(e.target.files)} />
        </label>
      )}
      <span className="hint">JPG o PNG. Se achican y optimizan solas al subirlas.{max > 1 ? " La primera es la foto principal." : ""}</span>
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  );
}
