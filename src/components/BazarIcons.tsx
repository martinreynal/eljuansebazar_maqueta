/**
 * Íconos de Bazar (dibujados a partir de las ilustraciones de la marca: bloques de color geométricos,
 * modernismo de los 60–70). Caja de 100 × 100. Cada ícono usa sus propios recortes (clipPath) con prefijo único.
 */
const F = "#1C4A35", T = "#C9521F", M = "#E09A1A", C = "#EFD8B8", Cl = "#F6E6D0", P = "#F9A37E", S = "#7F9168", O = "#D5741B";

export const BAZAR_ICONS: Record<string, React.ReactNode> = {
  "fuentes-y-bandejas": <>
    <defs>
      <clipPath id="fb-tray"><rect x="31" y="27" width="53" height="31" rx="5" /></clipPath>
      <clipPath id="fb-body"><path d="M14 47H74L68 70C67 74 64 76 60 76H28C24 76 21 74 20 70Z" /></clipPath>
    </defs>
    <rect x="25" y="20" width="65" height="45" rx="9" fill={T} />
    <g clipPath="url(#fb-tray)"><rect x="31" y="27" width="53" height="31" fill={O} /><circle cx="36" cy="64" r="42" fill={Cl} /></g>
    <rect x="9" y="51" width="11" height="8" rx="4" fill={C} />
    <rect x="68" y="51" width="11" height="8" rx="4" fill={C} />
    <g clipPath="url(#fb-body)">
      <rect x="10" y="40" width="70" height="40" fill={F} />
      <circle cx="58" cy="44" r="27" fill={M} />
      <circle cx="68" cy="86" r="30" fill={P} />
    </g>
    <rect x="13" y="42" width="62" height="9" rx="4.5" fill={Cl} />
  </>,

  bowls: <>
    <defs><clipPath id="bw-body"><path d="M18 34H82A32 40 0 0 1 18 34Z" /></clipPath></defs>
    <g clipPath="url(#bw-body)">
      <rect x="16" y="30" width="70" height="48" fill={F} />
      <circle cx="74" cy="26" r="29" fill={M} />
      <circle cx="86" cy="84" r="36" fill={P} />
    </g>
    <ellipse cx="50" cy="34" rx="32" ry="6" fill={Cl} />
  </>,

  vajilla: <>
    <defs>
      <clipPath id="vj-top"><path d="M28 18H74A23 24 0 0 1 28 18Z" /></clipPath>
      <clipPath id="vj-mid"><path d="M24 42H78A27 11 0 0 1 24 42Z" /></clipPath>
      <clipPath id="vj-bot"><path d="M18 54H84C84 64 76 72 66 72H36C26 72 18 64 18 54Z" /></clipPath>
    </defs>
    <g clipPath="url(#vj-bot)"><rect x="16" y="52" width="35" height="22" fill={T} /><rect x="51" y="52" width="35" height="22" fill={P} /></g>
    <g clipPath="url(#vj-mid)"><rect x="22" y="40" width="29" height="16" fill={F} /><rect x="51" y="40" width="29" height="16" fill={M} /></g>
    <g clipPath="url(#vj-top)"><rect x="26" y="16" width="50" height="28" fill={C} /><circle cx="86" cy="50" r="32" fill={S} /></g>
  </>,

  platos: <>
    <defs><clipPath id="pl-in"><circle cx="50" cy="50" r="17" /></clipPath></defs>
    <path d="M50 50V14A36 36 0 0 0 14 50Z" fill={F} />
    <path d="M50 50V14A36 36 0 0 1 86 50Z" fill={M} />
    <path d="M50 50H86A36 36 0 0 1 50 86Z" fill={T} />
    <path d="M50 50H14A36 36 0 0 0 50 86Z" fill={C} />
    <circle cx="50" cy="50" r="25" fill={Cl} />
    <g clipPath="url(#pl-in)"><rect x="32" y="32" width="36" height="36" fill={P} /><rect x="57" y="32" width="12" height="36" fill={O} /></g>
  </>,

  cubiertos: <>
    <defs>
      <clipPath id="cb-sp"><ellipse cx="30" cy="27" rx="11" ry="16" /></clipPath>
      <clipPath id="cb-fk"><path d="M41 8H45.6V22H48.6V8H51.4V22H54.4V8H59V30C59 37 55 41 50 41C45 41 41 37 41 30Z" /></clipPath>
    </defs>
    <rect x="27" y="38" width="6.5" height="48" rx="3.25" fill={F} />
    <g clipPath="url(#cb-sp)"><rect x="18" y="10" width="24" height="34" fill={F} /><circle cx="44" cy="26" r="15" fill={M} /></g>
    <rect x="46.8" y="38" width="6.5" height="48" rx="3.25" fill={F} />
    <g clipPath="url(#cb-fk)">
      <rect x="40" y="8" width="20" height="34" fill={T} />
      <circle cx="42" cy="44" r="16" fill={F} />
    </g>
    <path d="M73 8V47H64C61 39 61 26 63 19C65 12 69 8 73 8Z" fill={M} />
    <rect x="66.5" y="46" width="6.5" height="40" rx="3.25" fill={P} />
  </>,

  cafe: <>
    <defs>
      <clipPath id="cf-cup"><path d="M22 20H70V38C70 52 60 62 46 62C32 62 22 52 22 38Z" /></clipPath>
    </defs>
    <path d="M68 28A12 12 0 0 1 68 52" fill="none" stroke={M} strokeWidth="7" />
    <g clipPath="url(#cf-cup)">
      <rect x="20" y="18" width="26" height="46" fill={C} />
      <rect x="46" y="18" width="26" height="46" fill={F} />
      <circle cx="74" cy="70" r="30" fill={M} />
    </g>
    <path d="M18 66H80C78 74 70 79 60 79H38C28 79 20 74 18 66Z" fill={P} />
    <path d="M18 66H49V79H38C28 79 20 74 18 66Z" fill={T} />
  </>,

  cristaleria: <>
    <defs>
      <clipPath id="cr-wine"><path d="M38 8H62C65 22 64 35 50 44C36 35 35 22 38 8Z" /></clipPath>
      <clipPath id="cr-tum"><path d="M15 46H41V72C41 76 38 79 34 79H22C18 79 15 76 15 72Z" /></clipPath>
      <clipPath id="cr-cp"><path d="M58 50H88C87 59 80 64 73 64C66 64 59 59 58 50Z" /></clipPath>
    </defs>
    <g clipPath="url(#cr-tum)"><rect x="14" y="45" width="28" height="35" fill={T} /><circle cx="14" cy="45" r="16" fill={C} /><rect x="29" y="45" width="13" height="35" fill={P} /></g>
    <g clipPath="url(#cr-wine)">
      <rect x="34" y="6" width="16" height="22" fill={C} /><rect x="50" y="6" width="16" height="22" fill={T} />
      <rect x="34" y="28" width="16" height="18" fill={F} /><rect x="50" y="28" width="16" height="18" fill={M} />
    </g>
    <rect x="48.4" y="43" width="3.2" height="32" fill={F} />
    <path d="M40 80C40 76 45 74 50 74C55 74 60 76 60 80Z" fill={F} />
    <g clipPath="url(#cr-cp)"><rect x="56" y="48" width="34" height="18" fill={M} /><circle cx="62" cy="66" r="9" fill={C} /><circle cx="86" cy="66" r="13" fill={P} /></g>
    <rect x="71.4" y="63" width="3.2" height="12" fill={T} />
    <path d="M64 80C64 76.5 68 75 73 75C78 75 82 76.5 82 80Z" fill={T} />
  </>,

  servicio: <>
    <defs>
      <clipPath id="sv-pot"><rect x="20" y="44" width="34" height="34" rx="5" /></clipPath>
      <clipPath id="sv-hat"><circle cx="63" cy="21" r="8" /><circle cx="74" cy="15" r="10.5" /><circle cx="85" cy="21" r="8" /><rect x="58" y="19" width="32" height="13" /></clipPath>
      <clipPath id="sv-pan"><path d="M36 64H78C78 74 70 80 62 80H52C43 80 36 74 36 64Z" /></clipPath>
    </defs>
    <path d="M17 45C18 38 27 34 37 34C47 34 56 38 57 45Z" fill={T} />
    <rect x="34" y="28" width="6" height="7" rx="2.5" fill={F} />
    <g clipPath="url(#sv-pot)"><rect x="20" y="44" width="34" height="34" fill={C} /><circle cx="56" cy="72" r="22" fill={M} /></g>
    <rect x="13" y="50" width="9" height="6" rx="3" fill={F} /><rect x="52" y="50" width="9" height="6" rx="3" fill={F} />
    <g clipPath="url(#sv-hat)"><rect x="50" y="2" width="44" height="32" fill={C} /><rect x="74" y="2" width="8" height="32" fill={P} /><rect x="82" y="2" width="12" height="32" fill={T} /></g>
    <rect x="58" y="31" width="32" height="7" fill={F} />
    <path d="M77 66L92 58" stroke={T} strokeWidth="4.5" strokeLinecap="round" />
    <g clipPath="url(#sv-pan)"><rect x="34" y="62" width="46" height="20" fill={F} /><circle cx="78" cy="88" r="24" fill={M} /></g>
    <ellipse cx="57" cy="64" rx="21" ry="3.5" fill={Cl} />
  </>,

  "decoracion-y-presentacion": <>
    <defs>
      <clipPath id="dc-vase"><path d="M44 42H58L56 48C64 52 67 58 66 66C65 72 61 76 56 78H46C41 76 37 72 36 66C35 58 38 52 46 48Z" /></clipPath>
      <clipPath id="dc-can"><rect x="62" y="54" width="20" height="24" rx="3" /></clipPath>
      <clipPath id="dc-tray"><path d="M26 78H90C88 85 81 89 72 89H44C35 89 28 85 26 78Z" /></clipPath>
    </defs>
    <path d="M50 42C50 34 51 26 52 22" stroke={F} strokeWidth="2.6" fill="none" />
    <path d="M51 30C41 31 32 25 30 14C40 13 49 19 51 30Z" fill={F} />
    <path d="M52 22C51 12 57 5 66 3C67 12 61 20 52 22Z" fill={M} />
    <path d="M52 30C56 23 64 20 73 22C70 29 61 33 52 30Z" fill={P} />
    <g clipPath="url(#dc-vase)">
      <rect x="34" y="40" width="34" height="40" fill={T} />
      <rect x="34" y="52" width="16" height="16" fill={C} />
      <circle cx="35" cy="80" r="14" fill={F} />
    </g>
    <path d="M72 54C69 50 69 46 72 41C75 46 75 50 72 54Z" fill={M} />
    <g clipPath="url(#dc-can)"><rect x="62" y="54" width="20" height="24" fill={C} /><circle cx="86" cy="80" r="17" fill={T} /></g>
    <g clipPath="url(#dc-tray)"><rect x="24" y="76" width="34" height="14" fill={M} /><circle cx="86" cy="104" r="34" fill={F} /></g>
  </>,
};
