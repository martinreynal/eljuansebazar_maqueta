import Link from "next/link";
import { formatPhone } from "@/lib/format";
import type { Category, Settings } from "@/lib/types";
import { Logo } from "./Logo";

export function Footer({ settings, categories }: { settings: Settings; categories: Category[] }) {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div>
            <div className="logo" style={{ marginBottom: 12 }}><Logo name={settings.business_name} /></div>
            <p style={{ maxWidth: "34ch" }}>{settings.tagline}. Catálogo digital: las consultas y cotizaciones se coordinan por WhatsApp.</p>
          </div>
          <div>
            <h4>Categorías</h4>
            <ul>{categories.filter((c) => !c.is_offers).slice(0, 8).map((c) => <li key={c.id}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></li>)}</ul>
          </div>
          <div>
            <h4>Atención</h4>
            <ul>
              {settings.hours && <li>{settings.hours}</li>}
              <li>WhatsApp <span className="mono">{formatPhone(settings.whatsapp)}</span></li>
              <li>Envíos a todo el país</li>
            </ul>
          </div>
          <div>
            <h4>Más</h4>
            <ul>
              <li><a href="/catalogo.pdf" target="_blank" rel="noopener">Catálogo en PDF</a></li>
              {settings.instagram && <li>Instagram {settings.instagram}</li>}
              {settings.facebook && <li>Facebook {settings.facebook}</li>}
              <li><Link href="/#preguntas">Preguntas frecuentes</Link></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} {settings.business_name}</span>
          <span>No se realizan ventas en línea. Precios y disponibilidad se confirman por WhatsApp.</span>
        </div>
      </div>
    </footer>
  );
}
