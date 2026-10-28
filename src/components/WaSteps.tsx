"use client";
import Link from "next/link";
import { Clock, ListPlus, MessageCircle, Search } from "lucide-react";
import { WaLink } from "./WaLink";

/** Accesos rápidos del bloque "¿No encontrás lo que buscás?": buscador, lista y WhatsApp. */
export function WaSteps({ wa, hours }: { wa: string; hours?: string | null }) {
  const focusSearch = () => {
    const desk = document.getElementById("hdr-q") as HTMLInputElement | null;
    if (desk && desk.offsetParent !== null) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      desk.focus({ preventScroll: true });
      return;
    }
    // En el celular se abre el buscador de la cabecera
    window.dispatchEvent(new Event("ejb:search"));
  };
  return (
    <div className="steps">
      <button type="button" className="step-link" onClick={focusSearch}><Search />Buscá</button>
      <Link className="step-link" href="/lista"><ListPlus />Armá tu lista</Link>
      <WaLink href={wa} channel="general" className="step-link" icon={false}><MessageCircle />Consultanos</WaLink>
      {hours && <span><Clock />{hours}</span>}
    </div>
  );
}
