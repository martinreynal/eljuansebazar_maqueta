"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ListItem } from "@/lib/format";

type Toast = { text: string; link?: [string, string] } | null;

type Ctx = {
  list: ListItem[];
  favs: string[];
  ready: boolean;
  addToList: (sku: string, variant?: string, qty?: number) => void;
  setQty: (sku: string, variant: string, qty: number) => void;
  removeFromList: (sku: string, variant: string) => void;
  clearList: () => void;
  toggleFav: (sku: string) => boolean;
  toast: (text: string, link?: [string, string]) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`ejb:${key}`);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(`ejb:${key}`, JSON.stringify(v));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ListItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [toastState, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setList(load("list", []));
    setFavs(load("favs", []));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("list", list); }, [list, ready]);
  useEffect(() => { if (ready) save("favs", favs); }, [favs, ready]);

  const toast = useCallback((text: string, link?: [string, string]) => {
    setToast({ text, link });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      list,
      favs,
      ready,
      addToList: (sku, variant = "", qty = 1) =>
        setList((l) => {
          const i = l.findIndex((x) => x.sku === sku && x.variant === variant);
          if (i === -1) return [...l, { sku, variant, qty }];
          const c = [...l];
          c[i] = { ...c[i], qty: Math.min(999, c[i].qty + qty) };
          return c;
        }),
      setQty: (sku, variant, qty) =>
        setList((l) => l.map((x) => (x.sku === sku && x.variant === variant ? { ...x, qty: Math.max(1, Math.min(999, qty)) } : x))),
      removeFromList: (sku, variant) => setList((l) => l.filter((x) => !(x.sku === sku && x.variant === variant))),
      clearList: () => setList([]),
      toggleFav: (sku) => {
        const on = !favs.includes(sku);
        setFavs((f) => (on ? [...f, sku] : f.filter((x) => x !== sku)));
        return on;
      },
      toast,
    }),
    [list, favs, ready, toast],
  );

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className={`toast ${toastState ? "show" : ""}`} role="status" aria-live="polite">
        {toastState && (
          <>
            <span>{toastState.text}</span>
            {toastState.link && <Link href={toastState.link[1]}>{toastState.link[0]}</Link>}
          </>
        )}
      </div>
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fuera de StoreProvider");
  return c;
}
