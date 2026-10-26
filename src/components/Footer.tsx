import Link from "next/link";
import { formatPhone } from "@/lib/format";
import { GROUPS, groupHref } from "@/lib/groups";
import type { Category, Settings } from "@/lib/types";
import { Logo } from "./Logo";

export function Footer({ settings, categories }: { settings: Settings; categories: Category[] }) {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div>
            <div className="logo" style={{ marginBottom: 12 }}><Logo name={settings.business_name} tagline={settings.tagline} /></div>
            <p style={{ maxWidth: "34ch" }}>Catálogo digital de equipamiento gastronómico: las consultas y cotizaciones se coordinan por WhatsApp.</p>
          </div>
          <div className="only-d-block">
            <h4>Categorías</h4>
            <ul>
              {GROUPS.map((g) => <li key={g.key}><Link href={groupHref(g.key)}>{g.name}</Link></li>)}
              {categories.some((c) => c.is_offers) && <li><Link href="/ofertas">Ofertas</Link></li>}
              <li><Link href="/personalizados">Personalizados</Link></li>
              <li><Link href="/catalogo">Todo el catálogo</Link></li>
            </ul>
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
              <li><Link href="/nosotros">Nosotros</Link></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} {settings.business_name}</span>
          <span>No se realizan ventas en línea. Precios y disponibilidad se confirman por WhatsApp.</span>
        </div>
      </div>
      <a className="by-ap" href="https://www.argenprom.com.ar/" target="_blank" rel="noopener noreferrer" aria-label="by Argenprom (abre argenprom.com.ar en una pestaña nueva)">
        <span>by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/argenprom.png" alt="Argenprom · Fidelización digital" width={600} height={166} loading="lazy" decoding="async" />
      </a>
    </footer>
  );
}
