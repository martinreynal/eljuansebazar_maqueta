import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CloudUpload, Droplet, FilePen, Layers, Package, Tag, Zap } from "lucide-react";
import { WaLink } from "@/components/WaLink";
import { BrandMock, type MockStyle } from "@/components/BrandMock";
import { getStore } from "@/lib/data";
import { msgCustom, waLink } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Personalizados con tu logo",
  description: "Tazas, vasos, bandejas y utensilios personalizados con el logo de tu empresa: grabado láser, sublimación, serigrafía y etiquetas.",
  alternates: { canonical: "/personalizados" },
};

const BRAND_WORKS: { title: string; sku: string; tech: string; img: string; mock: MockStyle }[] = [
  { title: "Tazas de cerámica", sku: "CER-07", tech: "Sublimación o serigrafía", img: "/portada/marca-taza-limpia.jpg", mock: { x: 45, y: 50, w: 26, rot: 0, tone: "dark" } },
  { title: "Bandejas de bambú", sku: "BAM-01", tech: "Grabado láser", img: "/portada/marca-bandeja-limpia.jpg", mock: { x: 48.3, y: 50, w: 27, rot: 14, tone: "burnt" } },
  { title: "Vasos de vidrio", sku: "CRI-14", tech: "Serigrafía", img: "/portada/marca-vaso-limpia.jpg", mock: { x: 46.1, y: 50, w: 25, rot: 0, tone: "white" } },
  { title: "Cuchillos de asado", sku: "CUB-40", tech: "Grabado láser en la hoja", img: "/portada/marca-cuchillo-limpia.jpg", mock: { x: 43.5, y: 55.5, w: 15, rot: -29, tone: "steel" } },
];

export default async function CustomPage() {
  const { settings, products, categories } = await getStore();
  return (
    <div className="wrap">
      <section className="sec" id="personalizados" aria-labelledby="h-custom">
        <div className="brand-sec">
          <div className="bs-copy">
            <span className="h2-eyebrow">Regalos empresariales</span>
            <h1 id="h-custom">Tu marca,<br />en cada detalle.</h1>
            <p>Personalizamos tazas, vasos, tablas, utensilios y más con el logo de tu empresa. Ideal para regalos de fin de año, eventos, kits de bienvenida y merchandising.</p>
            <div className="bs-tech">
              <span><Zap />Grabado láser</span><span><Droplet />Sublimación</span><span><Layers />Serigrafía</span><span><Tag />Etiquetas</span>
            </div>
            <WaLink href={waLink(settings.whatsapp, msgCustom())} channel="custom" className="btn btn-cta btn-lg bs-cta">Pedir presupuesto con mi logo<ArrowRight /></WaLink>
          </div>
          <div className="bs-grid">
            {BRAND_WORKS.map((w, i) => {
              const p = products.find((x) => x.sku === w.sku);
              const c = p ? categories.find((x) => x.id === p.category_id) : undefined;
              const body = (
                <>
                  <BrandMock img={w.img} alt={`${w.title} personalizados con logo`} mock={w.mock} offset={i * 4} />
                  <span className="bs-meta"><b>{w.title}</b>{c && <small>Ver {c.name.toLowerCase()}</small>}</span>
                  <span className="bs-pill">{w.tech}</span>
                </>
              );
              return c ? <Link key={w.sku} className="bs-card" href={`/categoria/${c.slug}`}>{body}</Link> : <div key={w.sku} className="bs-card">{body}</div>;
            })}
          </div>
        </div>
        <ol className="bs-steps">
          <li><span className="n">1</span><CloudUpload aria-hidden /><span><b>Nos mandás tu logo</b>En PDF, AI o PNG en buena calidad, con la cantidad y los productos que te interesan.</span></li>
          <li><span className="n">2</span><FilePen aria-hidden /><span><b>Te enviamos boceto y presupuesto</b>Ves cómo queda antes de confirmar.</span></li>
          <li><span className="n">3</span><Package aria-hidden /><span><b>Producimos y enviamos</b>A tu oficina o a cualquier punto del país.</span></li>
        </ol>
      </section>
    </div>
  );
}
