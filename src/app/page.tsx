import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { GroupShape } from "@/components/GroupShape";
import { HomeSearch } from "@/components/HomeSearch";
import { getStore } from "@/lib/data";
import { GROUPS, groupHref, groupOf } from "@/lib/groups";
import type { CategoryGroup } from "@/lib/types";

export const revalidate = 300;
export const metadata: Metadata = {
  title: { absolute: "Saggio · Equipamiento para gastronomía y hotelería" },
  description: "Vajilla, cristalería, cubiertos y mobiliario para restaurantes, hoteles y cafeterías. Elegí la categoría y pedí tu cotización por WhatsApp.",
  alternates: { canonical: "/" },
};

/** Banners de los dos grupos del catálogo. */
const BANNERS: { key: CategoryGroup; title: string; line: string; img: string; pos: string; tone: "forest" | "terra" }[] = [
  { key: "mobiliario", title: "Mobiliario", line: "Muebles para restaurantes, hoteles y más", img: "/catalogo-grupos/mobiliario.jpg", pos: "50% 55%", tone: "terra" },
  { key: "bazar", title: "Bazar", line: "Vajilla, cristalería y equipamiento profesional", img: "/catalogo-grupos/bazar.jpg", pos: "45% 60%", tone: "forest" },
];

/** Portada = catálogo: los dos grupos y todas sus categorías con íconos. */
export default async function Home() {
  const { categories } = await getStore();
  const cats = categories.filter((c) => !c.is_offers);

  return (
    <div className="wrap ch">
      <div className="m-quick only-m"><HomeSearch /></div>

      <header className="ch-head">
        <span className="ch-eyebrow">Equipamiento para gastronomía y hotelería</span>
        <h1>Encontrá lo que necesitás<br className="only-d" /> para tu proyecto</h1>
      </header>

      <div className="ch-banners">
        {BANNERS.map((b, i) => (
          <Link key={b.key} href={groupHref(b.key)} className={`ch-banner ${b.tone}`}>
            <Image src={b.img} alt="" fill priority={i === 0} sizes="(max-width: 860px) 100vw, 50vw" style={{ objectPosition: b.pos }} />
            <GroupShape group={b.key} />
            <span className="ch-banner-t">
              <b>{b.title}</b>
              <i aria-hidden />
              <small>{b.line}</small>
              <span className="ch-go" aria-hidden><ArrowRight /></span>
            </span>
          </Link>
        ))}
      </div>

      {GROUPS.map((g) => {
        const list = cats.filter((c) => groupOf(c) === g.key);
        if (!list.length) return null;
        return (
          <section key={g.key} className={`ch-group ${g.key}`} aria-labelledby={`ch-${g.key}`}>
            <h2 id={`ch-${g.key}`} className="ch-gh">
              <span className="ch-leaf" aria-hidden />
              <Link href={groupHref(g.key)}>{g.name}</Link>
            </h2>
            <ul className="ch-tiles" style={{ ["--n" as string]: list.length }}>
              {list.map((c) => (
                <li key={c.id}>
                  <Link href={`/categoria/${c.slug}`} className="ch-tile">
                    <CategoryIcon slug={c.slug} group={g.key} />
                    <span>{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
