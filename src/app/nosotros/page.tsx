import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Gem, ListPlus, MessageCircle, Stamp, Truck } from "lucide-react";
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
  { icon: Gem, title: "Curaduría", text: "Elegimos cada pieza por su diseño, su resistencia al ritmo del servicio y su capacidad de combinar con el resto de la mesa." },
  { icon: Compass, title: "Asesoramiento", text: "Te ayudamos a definir estilos, materiales y cantidades según tu concepto, tu cantidad de cubiertos y tu tipo de servicio." },
  { icon: Stamp, title: "Personalización", text: "Sumamos tu logo con grabado láser, sublimación o serigrafía para que tu marca esté presente en cada detalle.", href: "/personalizados" },
];
const CLIENTS = ["Restaurantes", "Bares", "Cafeterías", "Hoteles", "Eventos y catering", "Regalos empresariales"];
const STEPS = [
  { icon: ListPlus, title: "Elegís", text: "Recorrés el catálogo y armás tu lista con los productos que te interesan." },
  { icon: MessageCircle, title: "Te asesoramos", text: "Por WhatsApp revisamos juntos la selección y te enviamos la cotización a medida." },
  { icon: Truck, title: "Lo recibís", text: "Coordinamos la entrega en tu local o en cualquier punto del país." },
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
          <p className="ab-lead">SAGGIO nace para acompañar a restaurantes, bares, cafeterías y hoteles en una decisión clave: con qué se sirve, dónde se sienta cada invitado y cómo se vive cada experiencia.</p>
          <p>Seleccionamos vajilla, cristalería, cubiertos y mobiliario pensando en el uso real de un salón: piezas que resisten el servicio diario, que conversan entre sí y que suman identidad a cada propuesta gastronómica. Trabajamos cerca de cada cliente, escuchamos su concepto y armamos la propuesta a medida.</p>
        </div>
        <div className="ab-img">
          <Image src="/portada/ambiente-verde.jpg" alt="Salón de restaurante con banqueta verde, sillas terracota y mesas de madera servidas" fill priority sizes="(max-width: 860px) 100vw, 44vw" style={{ objectPosition: "50% 55%" }} />
        </div>
      </section>

      <section className="sec ab-values" aria-label="Lo que nos define">
        {VALUES.map(({ icon: I, title, text, href }) => (
          <article key={title} className="ab-card">
            <span className="ab-ic"><I aria-hidden /></span>
            <h2>{title}</h2>
            <p>{text}</p>
            {href && <Link className="ab-link" href={href}>Ver personalizados <ArrowRight /></Link>}
          </article>
        ))}
      </section>

      <section className="sec ab-split" aria-labelledby="h-ab-who">
        <div className="ab-img ab-img-sm">
          <Image src="/portada/silla-terracota.jpg" alt="Silla tapizada en terracota y verde junto a una mesa de madera" fill sizes="(max-width: 860px) 100vw, 40vw" style={{ objectPosition: "50% 60%" }} />
        </div>
        <div className="ab-copy">
          <span className="h2-eyebrow">Para quién trabajamos</span>
          <h2 id="h-ab-who">Del primer boceto del salón a la última copa de la mesa.</h2>
          <p>Acompañamos aperturas, renovaciones y reposiciones. Tanto si equipás un local completo como si buscás una línea de vajilla que represente tu cocina, te ayudamos a elegir con criterio.</p>
          <ul className="ab-chips">{CLIENTS.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      </section>

      <section className="sec" aria-labelledby="h-ab-how">
        <div className="sec-head"><div><span className="h2-eyebrow">Cómo trabajamos</span><h2 id="h-ab-how" style={{ marginTop: 6 }}>Simple, cercano y sin vueltas</h2></div></div>
        <ol className="ab-steps">
          {STEPS.map(({ icon: I, title, text }, i) => (
            <li key={title}><span className="n">{i + 1}</span><I aria-hidden /><b>{title}</b><span>{text}</span></li>
          ))}
        </ol>
      </section>

      <section className="sec">
        <div className="ab-cta">
          <div>
            <h2>¿Tenés un proyecto en mente?</h2>
            <p>Contanos qué estás armando y te proponemos una selección a medida.</p>
          </div>
          <div className="ab-cta-btns">
            <WaLink href={wa} channel="general" className="btn btn-wa btn-lg">Escribinos por WhatsApp</WaLink>
            <Link href="/catalogo" className="btn btn-ghost btn-lg">Ver catálogo <ArrowRight /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
