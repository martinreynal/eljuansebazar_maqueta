"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Heart, House, LayoutGrid } from "lucide-react";
import { msgGeneral, waLink } from "@/lib/format";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";

/** Botón flotante de WhatsApp y barra inferior del celular (ocultos en el panel). */
export function Chrome({ name, whatsapp }: { name: string; whatsapp: string }) {
  const pathname = usePathname();
  const { list, favs } = useStore();
  if (pathname.startsWith("/admin")) return null;
  const units = list.reduce((a, i) => a + i.qty, 0);
  const tabs = [["/", House, "Inicio"], ["/catalogo", LayoutGrid, "Catálogo"], ["/favoritos", Heart, "Favoritos"], ["/lista", ClipboardList, "Lista"]] as const;
  return (
    <>
      <WaLink href={waLink(whatsapp, msgGeneral(name))} channel="general" className="wa-float" label="Consultanos por WhatsApp">
        <span>Consultanos</span>
      </WaLink>
      <nav className="tabbar" aria-label="Navegación principal">
        {tabs.map(([h, I, t]) => {
          const n = h === "/lista" ? units : h === "/favoritos" ? favs.length : null;
          const current = h === "/" ? pathname === "/" : pathname.startsWith(h) || (h === "/catalogo" && /^\/(categoria|producto|ofertas)/.test(pathname));
          return (
            <Link key={h} href={h} aria-current={current ? "page" : undefined}>
              <I /><span>{t}</span>
              {n !== null && <span className="badge" data-n={n}>{n}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
