import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Gem, Stamp } from "lucide-react";
import { WaLink } from "@/components/WaLink";
import { getStore } from "@/lib/data";
import { msgGeneral, waLink } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Nosotros",
  description: "SAGGIO acompaña a restaurantes, bares, cafeterías y hoteles con vajilla, cristalería, cubiertos y mobiliario seleccionados para el uso gastronómico.",
  alternates: { canonical: "/nosotros" },
};

const VALUES = [
  { icon: Gem, title: "Curaduría", text: "Piezas elegidas por diseño y resistencia al servicio diario." },
  { icon: Compass, title: "Asesoramiento", text: "Te ayudamos a definir estilos, materiales y cantidades." },
  { icon: Stamp, title: "Personalización", text: "Sumamos tu logo para que tu marca esté en cada detalle." },
];

export default async function AboutPage() {
  const { settings } = await getStore();
  const wa = waLink(settings.whatsapp, msgGeneral(settings.business_name));
  return (
    <div className="wrap ab">
      <section className="ab-hero" aria-labelledby="h-ab">
        <div className="ab-copy">
          <span className="h2-eyebrow">Nosotros</span>
          <h1 id="h-ab">Equipamos los espacios donde la gente se encuentra.</h1>
          <p className="ab-lead">En SAGGIO seleccionamos vajilla, cristalería, cubiertos y mobiliario para restaurantes, bares, cafeterías y hoteles, y armamos cada propuesta a medida.</p>
          <ul className="ab-mini">
            {VALUES.map(({ icon: I, title, text }) => (
              <li key={title}><span className="ab-ic"><I aria-hidden /></span><span><b>{title}</b>{text}</span></li>
            ))}
          </ul>
          <div className="ab-cta-btns">
            <WaLink href={wa} channel="general" className="btn btn-wa btn-lg">Escribinos por WhatsApp</WaLink>
            <Link href="/catalogo" className="btn btn-ghost btn-lg">Ver catálogo <ArrowRight /></Link>
          </div>
        </div>
        <div className="ab-img">
          <Image src="/portada/ambiente-verde.jpg" alt="Salón de restaurante con banqueta verde, sillas terracota y mesas de madera servidas" fill priority sizes="(max-width: 860px) 100vw, 44vw" style={{ objectPosition: "50% 55%" }} />
        </div>
      </section>
    </div>
  );
}
