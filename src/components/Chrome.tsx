"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, House, LayoutGrid, MessageCircle, Search } from "lucide-react";
import { msgGeneral, waLink } from "@/lib/format";
import { useStore } from "./store/StoreProvider";
import { WaLink } from "./WaLink";

/** Botón flotante de WhatsApp y barra inferior del celular (ocultos en el panel). */
export function Chrome({ name, whatsapp }: { name: string; whatsapp: string }) {
  const pathname = usePathname();
  const { list } = useStore();
  if (pathname.startsWith("/admin")) return null;
  const tabs = [["/", House, "Inicio"], ["/catalogo", LayoutGrid, "Catálogo"]] as const;
  const wa = waLink(whatsapp, msgGeneral(name));
  return (
    <>
      {pathname !== "/lista" && !pathname.startsWith("/producto/") && <WaLink href={wa} channel="general" className="wa-float" label="Consultanos por WhatsApp">
        <span>Consultanos</span>
      </WaLink>}
      <nav className="tabbar" aria-label="Navegación principal">
        {tabs.map(([h, I, t]) => {
          const current = h === "/" ? pathname === "/" : pathname.startsWith(h) || (h === "/catalogo" && /^\/(categoria|producto|ofertas)/.test(pathname));
          return <Link key={h} href={h} aria-current={current ? "page" : undefined}><I /><span>{t}</span></Link>;
        })}
        <button type="button" onClick={() => window.dispatchEvent(new Event("ejb:search"))}><Search /><span>Buscar</span></button>
        <Link href="/lista" aria-current={pathname === "/lista" ? "page" : undefined}>
          <ClipboardList /><span>Lista</span>
          <span className="badge" data-n={list.length} key={list.length}>{list.length}</span>
        </Link>
        <WaLink href={wa} channel="general" className="tab-wa" icon={false}><MessageCircle /><span>WhatsApp</span></WaLink>
      </nav>
    </>
  );
}
