"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ChartColumn, FolderTree, LogOut, Package, Palette, Settings, Store } from "lucide-react";

const TABS = [
  ["/admin/productos", Package, "Productos"],
  ["/admin/disponibilidad", Boxes, "Disponibilidad"],
  ["/admin/categorias", FolderTree, "Categorías"],
  ["/admin/diseno", Palette, "Diseño y textos"],
  ["/admin/configuracion", Settings, "Configuración"],
  ["/admin/estadisticas", ChartColumn, "Estadísticas"],
] as const;

export function AdminNav({ email, signOut }: { email: string; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Módulos del panel">
      {TABS.map(([h, I, t]) => (
        <Link key={h} href={h} className="adm-link" aria-current={pathname.startsWith(h) ? "true" : undefined}><I />{t}</Link>
      ))}
      <div className="sep" />
      <Link href="/" target="_blank" className="adm-link"><Store />Ver tienda</Link>
      <form action={signOut}><button type="submit" className="adm-link" style={{ width: "100%" }}><LogOut />Salir</button></form>
      <span className="hint only-d" style={{ padding: "8px 12px", overflowWrap: "anywhere" }}>{email}</span>
    </nav>
  );
}
