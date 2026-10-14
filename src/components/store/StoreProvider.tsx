"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ListItem } from "@/lib/format";

type Toast = { text: string; link?: [string, string]; action?: [string, () => void] } | null;

type Ctx = {
  list: ListItem[];
  favs: string[];
  ready: boolean;
  addToList: (sku: string, variant?: string, qty?: number) => void;
  setQty: (sku: string, variant: string, qty: number) => void;
  removeFromList: (sku: string, variant: string) => void;
  restoreItem: (item: ListItem, index: number) => void;
  setNote: (sku: string, variant: string, note: string) => void;
  listNote: string;
  setListNote: (note: string) => void;
  clearList: () => void;
  toggleFav: (sku: string) => boolean;
  toast: (text: string, link?: [string, string], action?: [string, () => void]) => void;
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
  const [listNote, setListNote] = useState("");
  const [ready, setReady] = useState(false);
  const [toastState, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setList(load("list", []));
    setFavs(load("favs", []));
    setListNote(load("listnote", ""));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("list", list); }, [list, ready]);
  useEffect(() => { if (ready) save("favs", favs); }, [favs, ready]);
  useEffect(() => { if (ready) save("listnote", listNote); }, [listNote, ready]);

  const toast = useCallback((text: string, link?: [string, string], action?: [string, () => void]) => {
    setToast({ text, link, action });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), action ? 5000 : 2800);
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
      restoreItem: (item, index) =>
        setList((l) => {
          if (l.some((x) => x.sku === item.sku && x.variant === item.variant)) return l;
          const c = [...l];
          c.splice(Math.min(index, c.length), 0, item);
          return c;
        }),
      setNote: (sku, variant, note) =>
        setList((l) => l.map((x) => (x.sku === sku && x.variant === variant ? { ...x, note: note.slice(0, 200) } : x))),
      listNote,
      setListNote: (note) => setListNote(note.slice(0, 600)),
      clearList: () => { setList([]); setListNote(""); },
      toggleFav: (sku) => {
        const on = !favs.includes(sku);
        setFavs((f) => (on ? [...f, sku] : f.filter((x) => x !== sku)));
        return on;
      },
      toast,
    }),
    [list, favs, ready, listNote, toast],
  );

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className={`toast ${toastState ? "show" : ""}`} role="status" aria-live="polite">
        {toastState && (
          <>
            <span>{toastState.text}</span>
            {toastState.link && <Link href={toastState.link[1]}>{toastState.link[0]}</Link>}
            {toastState.action && (
              <button type="button" onClick={() => { toastState.action![1](); setToast(null); }}>{toastState.action[0]}</button>
            )}
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
