import { ISO_BOTTOM, ISO_TOP, ISO_VB, WORD_VB, WORDMARK } from "@/lib/logo-paths";

/** Logos de ejemplo para las piezas personalizadas: SAGGIO + 15 marcas ficticias (todas en currentColor). */
const serif = { fontFamily: "var(--font-fraunces), Georgia, serif" };
const sans = { fontFamily: "var(--font-dm-sans), Arial, sans-serif" };
const [, , isoW, isoH] = ISO_VB.split(" ").map(Number);
const [, , wordW, wordH] = WORD_VB.split(" ").map(Number);

function Saggio() {
  const ih = 46, iw = (isoW / isoH) * ih, ww = 150, wh = (wordH / wordW) * ww;
  return (
    <svg viewBox="0 0 200 120">
      <g transform={`translate(${100 - iw / 2} 14) scale(${ih / isoH})`}><path d={ISO_TOP} /><path d={ISO_BOTTOM} /></g>
      <g transform={`translate(${100 - ww / 2} ${76}) scale(${ww / wordW})`}><path fillRule="evenodd" d={WORDMARK} /></g>
      <rect x="84" y={76 + wh + 8} width="32" height="2.5" />
    </svg>
  );
}

export const BRAND_LOGOS: { name: string; Logo: () => React.ReactElement }[] = [
  { name: "SAGGIO", Logo: Saggio },
  { name: "Trattoria Lume", Logo: () => (
    <svg viewBox="0 0 200 120"><circle cx="100" cy="38" r="14" />{Array.from({ length: 12 }).map((_, i) => <rect key={i} x="99" y="10" width="2" height="8" transform={`rotate(${i * 30} 100 38)`} />)}
      <text x="100" y="82" textAnchor="middle" fontSize="20" letterSpacing="5" style={serif}>TRATTORIA</text><text x="100" y="104" textAnchor="middle" fontSize="15" letterSpacing="9" style={sans}>LUME</text></svg>) },
  { name: "Café Ombra", Logo: () => (
    <svg viewBox="0 0 200 120"><ellipse cx="100" cy="34" rx="12" ry="17" transform="rotate(25 100 34)" />
      <text x="100" y="86" textAnchor="middle" fontSize="34" fontStyle="italic" style={serif}>Ombra</text><text x="100" y="106" textAnchor="middle" fontSize="11" letterSpacing="6" style={sans}>CAFÉ · DESDE 1998</text></svg>) },
  { name: "Bodega Sal", Logo: () => (
    <svg viewBox="0 0 200 120"><path d="M100 8 L140 20 V54 Q140 86 100 102 Q60 86 60 54 V20 Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <text x="100" y="52" textAnchor="middle" fontSize="13" letterSpacing="4" style={sans}>BODEGA</text><text x="100" y="78" textAnchor="middle" fontSize="26" style={serif}>SAL</text></svg>) },
  { name: "Casa Nonna", Logo: () => (
    <svg viewBox="0 0 200 120"><path d="M70 44 L100 18 L130 44" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" /><rect x="94" y="32" width="12" height="14" />
      <text x="100" y="80" textAnchor="middle" fontSize="28" style={serif}>Casa Nonna</text><text x="100" y="102" textAnchor="middle" fontSize="11" letterSpacing="5" style={sans}>COCINA DE FAMILIA</text></svg>) },
  { name: "Forno 9", Logo: () => (
    <svg viewBox="0 0 200 120"><circle cx="100" cy="52" r="40" fill="none" stroke="currentColor" strokeWidth="4" /><text x="100" y="72" textAnchor="middle" fontSize="54" style={serif}>9</text>
      <text x="100" y="112" textAnchor="middle" fontSize="13" letterSpacing="8" style={sans}>FORNO</text></svg>) },
  { name: "Hotel Marea", Logo: () => (
    <svg viewBox="0 0 200 120">{[0, 10, 20].map((d) => <path key={d} d={`M62 ${22 + d} q9.5 -8 19 0 t19 0 t19 0 t19 0`} fill="none" stroke="currentColor" strokeWidth="3.5" />)}
      <text x="100" y="82" textAnchor="middle" fontSize="30" letterSpacing="4" style={serif}>MAREA</text><text x="100" y="104" textAnchor="middle" fontSize="11" letterSpacing="8" style={sans}>HOTEL & SPA</text></svg>) },
  { name: "Bistró Olmo", Logo: () => (
    <svg viewBox="0 0 200 120"><path d="M100 10 C124 22 124 50 100 62 C76 50 76 22 100 10 Z" /><rect x="99" y="30" width="2" height="38" />
      <text x="100" y="94" textAnchor="middle" fontSize="26" style={serif}>Olmo</text><text x="100" y="112" textAnchor="middle" fontSize="10" letterSpacing="7" style={sans}>BISTRÓ</text></svg>) },
  { name: "La Brasa", Logo: () => (
    <svg viewBox="0 0 200 120"><path d="M100 8 C116 26 120 38 112 52 C110 42 104 38 102 32 C98 44 86 46 88 60 C76 50 80 30 100 8 Z" />
      <text x="100" y="92" textAnchor="middle" fontSize="30" letterSpacing="3" style={sans} fontWeight="700">LA BRASA</text><rect x="62" y="102" width="76" height="3" /></svg>) },
  { name: "Verde Café", Logo: () => (
    <svg viewBox="0 0 200 120"><circle cx="100" cy="46" r="34" fill="none" stroke="currentColor" strokeWidth="4" /><text x="100" y="62" textAnchor="middle" fontSize="44" style={serif}>V</text>
      <text x="100" y="108" textAnchor="middle" fontSize="16" letterSpacing="6" style={sans}>VERDE CAFÉ</text></svg>) },
  { name: "Mar & Fuego", Logo: () => (
    <svg viewBox="0 0 200 120"><path d="M100 10 A34 34 0 0 0 100 78 Z" /><path d="M100 10 A34 34 0 0 1 100 78" fill="none" stroke="currentColor" strokeWidth="4" />
      <text x="100" y="106" textAnchor="middle" fontSize="20" letterSpacing="3" style={serif}>MAR & FUEGO</text></svg>) },
  { name: "Miga", Logo: () => (
    <svg viewBox="0 0 200 120"><rect x="99" y="10" width="2.5" height="54" />{[18, 30, 42].map((y) => <g key={y}><ellipse cx="92" cy={y} rx="7" ry="4" transform={`rotate(-35 92 ${y})`} /><ellipse cx="109" cy={y} rx="7" ry="4" transform={`rotate(35 109 ${y})`} /></g>)}
      <text x="100" y="94" textAnchor="middle" fontSize="32" style={serif}>Miga</text><text x="100" y="112" textAnchor="middle" fontSize="10" letterSpacing="7" style={sans}>PANADERÍA</text></svg>) },
  { name: "Kumo", Logo: () => (
    <svg viewBox="0 0 200 120"><path d="M70 54 a14 14 0 0 1 6 -27 a20 20 0 0 1 38 -4 a16 16 0 0 1 16 31 Z" />
      <text x="100" y="92" textAnchor="middle" fontSize="28" letterSpacing="8" style={sans} fontWeight="300">KUMO</text><text x="100" y="110" textAnchor="middle" fontSize="10" letterSpacing="7" style={sans}>SUSHI BAR</text></svg>) },
  { name: "Ritmo Bar", Logo: () => (
    <svg viewBox="0 0 200 120">{[10, 28, 18, 36, 14, 24].map((hgt, i) => <rect key={i} x={70 + i * 11} y={56 - hgt} width="6" height={hgt} rx="3" />)}
      <text x="100" y="92" textAnchor="middle" fontSize="30" style={serif} fontStyle="italic">Ritmo</text><text x="100" y="110" textAnchor="middle" fontSize="10" letterSpacing="9" style={sans}>BAR</text></svg>) },
  { name: "Nube", Logo: () => (
    <svg viewBox="0 0 200 120"><circle cx="92" cy="24" r="12" /><circle cx="108" cy="24" r="12" /><circle cx="100" cy="14" r="11" /><path d="M86 32 L114 32 L100 64 Z" />
      <text x="100" y="94" textAnchor="middle" fontSize="30" style={sans} fontWeight="700" letterSpacing="2">nube</text><text x="100" y="111" textAnchor="middle" fontSize="10" letterSpacing="6" style={sans}>HELADERÍA</text></svg>) },
  { name: "El Ceibo", Logo: () => (
    <svg viewBox="0 0 200 120"><circle cx="100" cy="28" r="20" /><circle cx="84" cy="36" r="12" /><circle cx="116" cy="36" r="12" /><rect x="97" y="40" width="6" height="24" />
      <text x="100" y="92" textAnchor="middle" fontSize="26" style={serif}>El Ceibo</text><text x="100" y="110" textAnchor="middle" fontSize="10" letterSpacing="7" style={sans}>PARRILLA</text></svg>) },
];
