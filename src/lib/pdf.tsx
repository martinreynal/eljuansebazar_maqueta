import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPhone, waLink } from "./format";
import type { StoreData } from "./types";

const C = { ink: "#2A2724", ink2: "#5D5750", muted: "#8C8478", line: "#E5DED2", bg: "#F7F4EE", accent: "#2F4E8C", wa: "#1E8A52" };

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 52, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9, color: C.ink, lineHeight: 1.4 },
  cover: { padding: 48, backgroundColor: C.bg, fontFamily: "Helvetica", color: C.ink },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, fontFamily: "Helvetica-Bold" },
  h2: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  head: { borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingBottom: 10, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "31.5%", marginBottom: 16 },
  img: { width: "100%", height: 150, borderRadius: 6, objectFit: "cover", marginBottom: 6 },
  sku: { fontFamily: "Courier", fontSize: 8, color: C.ink2 },
  name: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginVertical: 2 },
  desc: { fontSize: 8.3, color: C.ink2 },
  spec: { flexDirection: "row", fontSize: 7.8, marginTop: 2 },
  specK: { color: C.muted, width: 52, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: C.muted },
});

export type PdfImages = { logo?: Buffer; byProduct: Map<string, Buffer | string> };

export function CatalogPdf({ data, images, base }: { data: StoreData; images: PdfImages; base: string }) {
  const { settings, categories, products } = data;
  const phone = formatPhone(settings.whatsapp);
  const date = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date());
  const cats = categories.filter((c) => !c.is_offers).map((c) => ({ c, items: products.filter((p) => p.category_id === c.id) })).filter((x) => x.items.length);
  const Footer = () => (
    <View style={s.footer} fixed>
      <Text>{settings.business_name} · {settings.tagline} · Cotizaciones por WhatsApp {phone}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
  return (
    <Document title={`Catálogo ${settings.business_name}`} author={settings.business_name} language="es-AR">
      <Page size="A4" style={s.cover}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <Text style={[s.eyebrow, { textAlign: "right" }]}>Catálogo · {date}</Text>
          <View>
            {images.logo ? <Image src={images.logo} style={{ width: 300, marginBottom: 18, marginLeft: -6 }} /> : <Text style={{ fontSize: 40, fontFamily: "Helvetica-Bold" }}>{settings.business_name}</Text>}
            <Text style={{ fontSize: 14, color: C.accent, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>{settings.tagline}</Text>
            <Text style={{ fontSize: 12, color: C.ink2, maxWidth: 360 }}>Vajilla, cocina, organización, deco y artículos para el hogar. Para tu casa o tu empresa, con opción de personalización con logo.</Text>
          </View>
          <View style={{ flexDirection: "row", borderTopWidth: 1.5, borderTopColor: C.ink, paddingTop: 10 }}>
            <View style={{ flex: 1 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Cotizaciones por WhatsApp</Text><Link src={waLink(settings.whatsapp, "Hola, vi el catálogo y quería pedir una cotización.")} style={{ color: C.wa, textDecoration: "none" }}>{phone}</Link></View>
            <View style={{ flex: 1 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Atención</Text><Text style={{ color: C.ink2 }}>{settings.hours || "Consultanos"}</Text></View>
            <View style={{ flex: 1 }}><Text style={{ fontFamily: "Helvetica-Bold" }}>Web</Text><Link src={base} style={{ color: C.ink2, textDecoration: "none" }}>{base.replace(/^https?:\/\//, "")}</Link></View>
          </View>
        </View>
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Cómo pedir una cotización</Text>
        {[
          ["Elegí los productos", "Anotá el código (SKU) de cada artículo que te interese. Está arriba del nombre."],
          ["Escribinos por WhatsApp", `Al ${phone}, con los códigos, las cantidades y si los querés con logo.`],
          ["Recibí tu cotización", "Te pasamos precio según cantidad, disponibilidad y costo de envío."],
        ].map(([t, d], i) => (
          <View key={t} style={{ flexDirection: "row", marginTop: 12 }}>
            <Text style={{ width: 22, fontFamily: "Helvetica-Bold", fontSize: 12 }}>{i + 1}</Text>
            <View style={{ flex: 1 }}><Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5 }}>{t}</Text><Text style={{ color: C.ink2, fontSize: 10 }}>{d}</Text></View>
          </View>
        ))}
        <Text style={[s.h2, { marginTop: 32 }]}>Índice</Text>
        {cats.map(({ c, items }) => (
          <View key={c.id} style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.6, borderBottomColor: C.line, paddingVertical: 7, fontSize: 10.5 }}>
            <Text>{c.name}</Text><Text style={{ color: C.muted }}>{items.length} productos</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.6, borderBottomColor: C.line, paddingVertical: 7, fontSize: 10.5 }}>
          <Text>Personalización con logo</Text><Text style={{ color: C.muted }}>Regalos empresariales</Text>
        </View>
        <Footer />
      </Page>

      {cats.map(({ c, items }) => (
        <Page key={c.id} size="A4" style={s.page}>
          <View style={s.head}><Text style={s.eyebrow}>{items.length} productos</Text><Text style={s.h2}>{c.name}</Text></View>
          <View style={s.grid}>
            {items.map((p) => {
              const img = images.byProduct.get(p.id);
              return (
                <View key={p.id} style={s.card} wrap={false}>
                  {img ? <Image src={img} style={s.img} /> : <View style={[s.img, { backgroundColor: C.line }]} />}
                  <Text style={s.sku}>{p.sku}</Text>
                  <Link src={`${base}/producto/${p.slug}`} style={{ color: C.ink, textDecoration: "none" }}><Text style={s.name}>{p.name}</Text></Link>
                  {p.description ? <Text style={s.desc}>{p.description}</Text> : null}
                  {p.materials ? <View style={s.spec}><Text style={s.specK}>Materiales</Text><Text style={{ flex: 1 }}>{p.materials}</Text></View> : null}
                  {p.dimensions ? <View style={s.spec}><Text style={s.specK}>Medidas</Text><Text style={{ flex: 1 }}>{p.dimensions}</Text></View> : null}
                  {p.variants.length ? <View style={s.spec}><Text style={s.specK}>Variantes</Text><Text style={{ flex: 1 }}>{p.variants.join(" · ")}</Text></View> : null}
                </View>
              );
            })}
          </View>
          <Footer />
        </Page>
      ))}

      <Page size="A4" style={s.page}>
        <View style={s.head}><Text style={s.eyebrow}>{settings.design.customEyebrow}</Text><Text style={s.h2}>Personalización con logo</Text></View>
        <Text style={{ fontSize: 11, color: C.ink2, marginBottom: 10 }}>{settings.design.customText}</Text>
        <Text style={{ fontSize: 10.5, color: C.ink2 }}>Técnicas: grabado láser, sublimación, serigrafía y etiquetas.</Text>
        {data.faqs.slice(0, 6).map((f) => (
          <View key={f.id} style={{ marginTop: 12 }}><Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5 }}>{f.question}</Text><Text style={{ color: C.ink2, fontSize: 9.5 }}>{f.answer}</Text></View>
        ))}
        <Link src={waLink(settings.whatsapp, "Hola, quería pedir un presupuesto de productos con el logo de mi empresa.")} style={{ marginTop: 24, backgroundColor: C.wa, color: "#FFFFFF", padding: 12, borderRadius: 6, fontFamily: "Helvetica-Bold", fontSize: 11, textDecoration: "none" }}>
          Pedí tu presupuesto con logo por WhatsApp: {phone}
        </Link>
        <Footer />
      </Page>
    </Document>
  );
}
