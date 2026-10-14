"use client";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

/** Campo de cantidad: se puede escribir el número o usar los botones. */
export function QtyInput({ value, onChange, name, size }: { value: number; onChange: (n: number) => void; name: string; size?: "lg" }) {
  const set = (n: number) => onChange(Math.max(1, Math.min(999, n)));
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 1) set(n);
    else setDraft(String(value));
  };
  return (
    <div className={`qty ${size ?? ""}`} role="group" aria-label={`Cantidad de ${name}`}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= 1} aria-label="Restar uno"><Minus /></button>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Cantidad"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= 999} aria-label="Sumar uno"><Plus /></button>
    </div>
  );
}
