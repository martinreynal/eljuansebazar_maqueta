"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** Buscador grande del inicio (celular): lleva al catálogo con la búsqueda aplicada. */
export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className="search home-search"
      role="search"
      onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : "/catalogo"); }}
    >
      <Search aria-hidden />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué estás buscando? Nombre o código" aria-label="Buscar productos por nombre o código" enterKeyHint="search" autoComplete="off" />
      <button type="submit" className="home-search-go">Buscar</button>
    </form>
  );
}
