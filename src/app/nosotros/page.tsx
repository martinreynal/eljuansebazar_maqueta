import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WaLink } from "@/components/WaLink";
import { getStore } from "@/lib/data";
import { msgGeneral, waLink } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Nosotros",
  description: "SAGGIO acompaña a restaurantes, bares, cafeterías y hoteles con vajilla, cristalería, cubiertos y mobiliario seleccionados para el uso gastronómico.",
  alternates: { canonical: "/nosotros" },
};

export default async function AboutPage() {
  const { settings, faqs } = await getStore();
  const wa = waLink(settings.whatsapp, msgGeneral(settings.business_name));
  return (
    <div className="wrap ab">
      <section className="ab-hero" aria-labelledby="h-ab">
        <div className="ab-copy">
          <span className="h2-eyebrow">Nosotros</span>
          <h1 id="h-ab">Equipamos los espacios donde la gente se encuentra.</h1>
          <p className="ab-lead">En SAGGIO seleccionamos vajilla, cristalería, cubiertos y mobiliario para restaurantes, bares, cafeterías y hoteles, y armamos cada propuesta a medida.</p>
          <div className="ab-import">
            <p>Trabajamos con <b>productos importados de la más alta calidad</b>, seleccionados uno a uno entre fabricantes que cumplen estándares internacionales de diseño y durabilidad.</p>
            <p>Cada pieza, de la vajilla al mobiliario, se elige por sus materiales nobles, sus terminaciones cuidadas y su resistencia al ritmo real de un salón, para que tu propuesta luzca impecable hoy y después de miles de servicios.</p>
          </div>
          <div className="ab-cta-btns">
            <WaLink href={wa} channel="general" className="btn btn-wa btn-lg">Escribinos por WhatsApp</WaLink>
            <Link href="/catalogo" className="btn btn-ghost btn-lg">Ver catálogo <ArrowRight /></Link>
          </div>
        </div>
        <div className="ab-img">
          <Image src="/portada/ambiente-verde.jpg" alt="Salón de restaurante con banqueta verde, sillas terracota y mesas de madera servidas" fill priority sizes="(max-width: 860px) 100vw, 44vw" style={{ objectPosition: "50% 55%" }} />
        </div>
      </section>
      {faqs.length > 0 && (
        <section className="sec" id="preguntas" aria-labelledby="h-faq">
          <div className="faq-wrap">
            <div className="side">
              <h2 id="h-faq">Preguntas frecuentes</h2>
              <p>Lo que más nos consultan. ¿No está tu duda? Escribinos.</p>
              <WaLink href={wa} channel="general" className="btn btn-ghost">Hacer otra pregunta</WaLink>
            </div>
            <div className="faq">
              {faqs.map((f) => (
                <details key={f.id}>
                  <summary>{f.question}<span aria-hidden className="plus">+</span></summary>
                  <div className="ans">{f.answer}</div>
                </details>
              ))}
            </div>
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }) }} />
        </section>
      )}
    </div>
  );
}
