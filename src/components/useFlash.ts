"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Estado breve para confirmaciones visuales (ej: "Agregado ✓"). */
export function useFlash(ms = 1400) {
  const [on, setOn] = useState(0);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);
  const fire = useCallback(() => {
    setOn((n) => n + 1);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setOn(0), ms);
  }, [ms]);
  return [on, fire] as const;
}
