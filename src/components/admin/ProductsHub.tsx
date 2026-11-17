"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, FolderTree, Package } from "lucide-react";

/** Secciones que forman parte de «Productos» en el panel. */
export const PRODUCT_TABS = [
  { href: "/admin/productos", Icon: Package, label: "Listado", line: "Alta, edición y publicación" },
  { href: "/admin/categorias", Icon: FolderTree, label: "Categorías", line: "Grupos, orden y portadas" },
  { href: "/admin/disponibilidad", Icon: Boxes, label: "Disponibilidad", line: "Stock y estado" },
  { href: "/admin/contracara", Icon: ClipboardList, label: "Contracara", line: "Compra y logística" },
] as const;
export const isProductsArea = (path: string) => PRODUCT_TABS.some((t) => path === t.href || path.startsWith(`${t.href}/`));

/** Encabezado de la entrada «Productos»: agrupa listado, categorías, disponibilidad y contracara en pestañas. */
export function ProductsHub() {
  const path = usePathname();
  if (!isProductsArea(path)) return null;
  return (
    <header className="phub">
      <div className="phub-h">
        <h1>Productos</h1>
        <p>Todo lo de tus productos en un solo lugar: qué se publica, cómo se organiza, qué hay disponible y los datos de compra.</p>
      </div>
      <nav className="phub-tabs" aria-label="Secciones de Productos">
        {PRODUCT_TABS.map(({ href, Icon, label, line }) => {
          const on = path === href || path.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={`phub-tab${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
              <span className="phub-ic"><Icon /></span>
              <span className="phub-t"><b>{label}</b><small>{line}</small></span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
