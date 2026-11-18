import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ujhzhyraalxcblchnztu.supabase.co").hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
  },
  serverExternalPackages: ["@resvg/resvg-js", "@react-pdf/renderer"],
  poweredByHeader: false,
  // Restaura la posición de scroll al volver atrás entre páginas
  experimental: { scrollRestoration: true },
  outputFileTracingIncludes: { "/catalogo.pdf": ["./public/logo-saggio.png", "./public/catalogo/mini/**"] },
  // El simulador de mesa 3D está desactivado por ahora: su dirección lleva al catálogo
  async redirects() {
    return [{ source: "/simulador", destination: "/catalogo", permanent: false }, { source: "/simulador/:path*", destination: "/catalogo", permanent: false }, { source: "/categoria/vajilla-estandar", destination: "/categoria/vajilla", permanent: true }, { source: "/categoria/platos-y-bowls", destination: "/categoria/platos", permanent: true }, { source: "/categoria/vajilla-blanca", destination: "/categoria/vajilla", permanent: true }, { source: "/categoria/gres", destination: "/categoria/vajilla", permanent: true }, { source: "/categoria/vajilla-decorada", destination: "/categoria/vajilla", permanent: true }, { source: "/categoria/sets", destination: "/categoria/mobiliario", permanent: false }, { source: "/categoria/asado-y-parrilla", destination: "/categoria/cubiertos", permanent: true }, { source: "/categoria/vajilla-marmolada", destination: "/categoria/vajilla", permanent: true }, { source: "/favoritos", destination: "/catalogo", permanent: false }, { source: "/categoria/mesas-auxiliares", destination: "/categoria/mesas-de-luz-y-auxiliares", permanent: true }, { source: "/categoria/muebles-auxiliares", destination: "/categoria/mesas-de-luz-y-auxiliares", permanent: true }, { source: "/categoria/muebles-de-servicio-y-almacenamiento", destination: "/categoria/mobiliario-de-servicio", permanent: true }, { source: "/categoria/sofas-y-sillones", destination: "/categoria/sofas-y-lounge", permanent: true }, { source: "/categoria/boxes-y-bancos", destination: "/categoria/sofas-y-lounge", permanent: true }, { source: "/categoria/exterior-lounge", destination: "/categoria/exterior", permanent: true }, { source: "/categoria/bandejas-y-servicio", destination: "/categoria/fuentes-y-bandejas", permanent: true }, { source: "/categoria/vajilla-oriental", destination: "/categoria/bazar", permanent: false }, { source: "/categoria/cocteleria-y-bar", destination: "/categoria/cristaleria", permanent: true }, { source: "/categoria/buffet-y-autoservicio", destination: "/categoria/servicio", permanent: true }, { source: "/categoria/utensilios-de-cocina", destination: "/categoria/servicio", permanent: true }, { source: "/categoria/accesorios-de-mesa", destination: "/categoria/decoracion-y-presentacion", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
