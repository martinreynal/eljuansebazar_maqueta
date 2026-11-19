/**
 * Íconos de Mobiliario (a partir de las ilustraciones de la marca). Caja de 100 × 100, mismo estilo que los de Bazar.
 * Sofás y Banquetas se dibujaron con el mismo lenguaje (no había ilustración de referencia).
 */
const F = "#1C4A35", T = "#C9521F", M = "#E09A1A", C = "#EFD8B8", Cl = "#F6E6D0", P = "#F9A37E", O = "#D5741B", R = "#B8452E";

export const MOBILIARIO_ICONS: Record<string, React.ReactNode> = {
  "camas-y-cabeceras": <>
    <path d="M16 62A34 34 0 0 1 84 62Z" fill={F} />
    <path d="M24 61A13 13 0 0 1 49 61Z" fill={Cl} />
    <path d="M51 61A13 13 0 0 1 76 61Z" fill={Cl} />
    <rect x="18" y="82" width="6" height="10" fill={R} /><rect x="76" y="82" width="6" height="10" fill={R} />
    <path d="M10 71C10 64 15 60 22 60H78C85 60 90 64 90 71V72H10Z" fill={O} />
    <rect x="10" y="72" width="80" height="11" fill={M} />
  </>,

  "mesas-de-luz-y-auxiliares": <>
    <path d="M33 26A17 17 0 0 1 67 26Z" fill={F} />
    <rect x="48.5" y="26" width="3" height="12" fill={M} />
    <path d="M41 42A9 9 0 0 1 59 42Z" fill={C} />
    <rect x="21" y="70" width="6" height="22" fill={R} /><rect x="73" y="70" width="6" height="22" fill={R} />
    <path d="M17 54H83V68C83 76 76 80 68 80H32C24 80 17 76 17 68Z" fill={M} />
    <rect x="17" y="49" width="66" height="14" fill={C} />
    <path d="M13 50C13 45 16 42 22 42H78C84 42 87 45 87 50Z" fill={O} />
    <circle cx="50" cy="56" r="4" fill={F} />
  </>,

  "armarios-y-almacenamiento": <>
    <defs><clipPath id="ar-b"><rect x="24" y="12" width="52" height="60" rx="6" /></clipPath></defs>
    <g clipPath="url(#ar-b)">
      <rect x="24" y="12" width="26" height="60" fill={C} />
      <rect x="50" y="12" width="26" height="60" fill={T} />
      <path d="M24 44C38 45 48 56 50 72H24Z" fill={F} />
      <path d="M76 44C62 45 52 56 50 72H76Z" fill={M} />
    </g>
    <rect x="45" y="38" width="3" height="9" rx="1.5" fill={T} /><rect x="52" y="38" width="3" height="9" rx="1.5" fill={Cl} />
    <rect x="26" y="72" width="48" height="4" rx="2" fill={T} />
    <path d="M30 76H35L33 87H31Z" fill={T} /><path d="M65 76H70L69 87H67Z" fill={T} />
  </>,

  escritorios: <>
    <path d="M23 42V20C23 12 30 8 37 11" fill="none" stroke={T} strokeWidth="4" strokeLinecap="round" />
    <path d="M34 14A11 11 0 0 1 53 22L35 26Z" fill={F} />
    <path d="M53 22L35 26C40 25 47 23 53 22Z" fill={C} />
    <path d="M17 44A6 6 0 0 1 29 44Z" fill={M} />
    <rect x="58" y="30" width="16" height="5" rx="1.5" fill={T} />
    <rect x="55" y="35" width="22" height="6" rx="2" fill={C} />
    <rect x="13" y="43" width="74" height="6" rx="3" fill={F} />
    <rect x="17" y="49" width="5" height="38" fill={F} />
    <defs><clipPath id="es-cab"><path d="M59 49H81V83C81 85 79 87 77 87H63C61 87 59 85 59 83Z" /></clipPath></defs>
    <g clipPath="url(#es-cab)"><rect x="59" y="49" width="22" height="13" fill={M} /><rect x="59" y="62" width="22" height="26" fill={C} /><circle cx="84" cy="90" r="17" fill={F} /></g>
    <rect x="66" y="54" width="8" height="2.6" rx="1.3" fill={C} /><rect x="66" y="69" width="8" height="2.6" rx="1.3" fill={T} />
    <defs><clipPath id="es-ch"><path d="M33 52C33 49 35 47 38 47H50C53 47 55 49 55 52V67H33Z" /></clipPath></defs>
    <g clipPath="url(#es-ch)"><rect x="33" y="47" width="22" height="20" fill={T} /><circle cx="30" cy="48" r="18" fill={C} /></g>
    <path d="M36 72L33 86" stroke={T} strokeWidth="3" strokeLinecap="round" /><path d="M52 72L55 86" stroke={T} strokeWidth="3" strokeLinecap="round" />
    <rect x="30" y="66" width="28" height="7" rx="3.5" fill={P} />
  </>,

  sillas: <>
    <defs>
      <clipPath id="si-b1"><rect x="18" y="14" width="30" height="20" rx="8" /></clipPath>
      <clipPath id="si-b2"><path d="M45 34C45 26 50 22 58 22H74C80 22 84 26 84 34V60H45Z" /></clipPath>
    </defs>
    <g clipPath="url(#si-b1)"><rect x="18" y="14" width="30" height="20" fill={M} /><circle cx="50" cy="38" r="21" fill={F} /></g>
    <rect x="22" y="34" width="3.5" height="10" fill={T} /><rect x="40" y="34" width="3.5" height="10" fill={T} />
    <path d="M17 44C17 41 19 40 22 40H40C43 40 45 41 45 44V47H17Z" fill={C} />
    <rect x="17" y="47" width="28" height="4" fill={T} />
    <path d="M21 51L18 78" stroke={T} strokeWidth="3.2" strokeLinecap="round" /><path d="M41 51L44 78" stroke={T} strokeWidth="3.2" strokeLinecap="round" />
    <g clipPath="url(#si-b2)"><rect x="45" y="22" width="40" height="38" fill={T} /><circle cx="44" cy="22" r="34" fill={C} /></g>
    <path d="M48 76L45 87" stroke={T} strokeWidth="3.4" strokeLinecap="round" /><path d="M80 76L83 87" stroke={T} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M34 50C34 45 37 42 42 42C47 42 50 45 50 50V72H34Z" fill={T} /><path d="M40 42C45 42 50 45 50 50V72H44V50C44 46 43 43 40 42Z" fill={P} />
    <path d="M80 50C80 45 83 42 88 42C93 42 96 45 96 50V66C96 71 92 74 88 74H80Z" fill={T} /><path d="M80 50C80 45 83 42 88 42C85 43 84 46 84 50V74H80Z" fill={P} />
    <path d="M47 60C47 56 50 54 54 54H76C80 54 82 56 82 60V64H47Z" fill={M} />
    <rect x="47" y="64" width="35" height="11" fill={F} />
  </>,

  "sofas-y-lounge": <>
    <defs><clipPath id="so-b"><path d="M20 30C20 24 24 20 30 20H70C76 20 80 24 80 30V58H20Z" /></clipPath></defs>
    <g clipPath="url(#so-b)"><rect x="20" y="20" width="60" height="38" fill={F} /><circle cx="22" cy="58" r="30" fill={C} /></g>
    <rect x="24" y="52" width="25" height="10" rx="4" fill={M} /><rect x="51" y="52" width="25" height="10" rx="4" fill={M} />
    <rect x="22" y="62" width="56" height="10" fill={T} />
    <path d="M10 46C10 41 13 38 18 38C23 38 26 41 26 46V72H10Z" fill={O} /><path d="M74 46C74 41 77 38 82 38C87 38 90 41 90 46V72H74Z" fill={O} />
    <path d="M16 72L14 82" stroke={R} strokeWidth="3.4" strokeLinecap="round" /><path d="M84 72L86 82" stroke={R} strokeWidth="3.4" strokeLinecap="round" />
  </>,

  mesas: <>
    <defs><clipPath id="me-top"><ellipse cx="50" cy="30" rx="38" ry="10" /></clipPath></defs>
    <path d="M44 42C44 50 46 58 44 64C42 70 36 73 34 78H66C64 73 58 70 56 64C54 58 56 50 56 42Z" fill={T} />
    <path d="M12 30V34C12 40 29 45 50 45C71 45 88 40 88 34V30Z" fill={M} />
    <g clipPath="url(#me-top)"><rect x="10" y="18" width="80" height="24" fill={Cl} /><path d="M62 18C64 28 52 36 36 42H92V18Z" fill={F} /></g>
  </>,

  banquetas: <>
    <defs><clipPath id="ba-s"><rect x="28" y="16" width="44" height="14" rx="7" /></clipPath></defs>
    <rect x="31" y="10" width="38" height="8" rx="4" fill={F} />
    <g clipPath="url(#ba-s)"><rect x="28" y="16" width="44" height="14" fill={M} /><circle cx="76" cy="36" r="16" fill={P} /></g>
    <path d="M36 30L30 88" stroke={T} strokeWidth="4" strokeLinecap="round" /><path d="M64 30L70 88" stroke={T} strokeWidth="4" strokeLinecap="round" />
    <path d="M45 30L44 84" stroke={R} strokeWidth="3" strokeLinecap="round" /><path d="M55 30L56 84" stroke={R} strokeWidth="3" strokeLinecap="round" />
    <rect x="31" y="62" width="38" height="5" rx="2.5" fill={C} />
  </>,

  "mostradores-y-recepcion": <>
    <path d="M60 18C60 16 61 15 63 15H82C84 15 85 16 84 18L80 30C80 31 79 32 77 32H58C56 32 56 31 56 30Z" fill={F} />
    <path d="M66 32H72L73 38H65Z" fill={T} />
    <defs><clipPath id="mo-b"><path d="M18 44H82V74C82 78 79 80 75 80H25C21 80 18 78 18 74Z" /></clipPath></defs>
    <g clipPath="url(#mo-b)">
      <rect x="18" y="44" width="64" height="36" fill={T} />
      <path d="M22 44C24 62 36 78 56 80H40C40 80 22 76 22 44Z" fill={T} />
      <path d="M22 44H48C48 62 54 74 66 80H44C30 76 23 62 22 44Z" fill={C} />
      <path d="M46 44H82V80H66C52 74 46 60 46 44Z" fill={F} />
    </g>
    <rect x="12" y="38" width="76" height="7" rx="3.5" fill={M} />
    <path d="M23 80L24 88" stroke={T} strokeWidth="3.4" strokeLinecap="round" /><path d="M77 80L76 88" stroke={T} strokeWidth="3.4" strokeLinecap="round" />
  </>,
};
