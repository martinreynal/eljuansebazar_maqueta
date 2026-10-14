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
  const tabs = [["/", House, "Inicio"], ["/catalogo", LayoutGrid, "Catálogo"], ["/favoritos", Heart, "Favoritos"], ["/lista", ClipboardList, "Lista"]] as const;
  return (
    <>
      {pathname !== "/lista" && !pathname.startsWith("/producto/") && <WaLink href={waLink(whatsapp, msgGeneral(name))} channel="general" className="wa-float" label="Consultanos por WhatsApp">
        <span>Consultanos</span>
      </WaLink>}
      <nav className="tabbar" aria-label="Navegación principal">
        {tabs.map(([h, I, t]) => {
          const n = h === "/lista" ? list.length : h === "/favoritos" ? favs.length : null;
          const current = h === "/" ? pathname === "/" : pathname.startsWith(h) || (h === "/catalogo" && /^\/(categoria|producto|ofertas)/.test(pathname));
          return (
            <Link key={h} href={h} aria-current={current ? "page" : undefined}>
              <I /><span>{t}</span>
              {n !== null && <span className="badge" data-n={n} key={n}>{n}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
