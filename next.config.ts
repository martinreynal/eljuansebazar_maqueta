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
    return [{ source: "/simulador", destination: "/catalogo", permanent: false }, { source: "/simulador/:path*", destination: "/catalogo", permanent: false }, { source: "/categoria/vajilla-estandar", destination: "/categoria/vajilla", permanent: true }, { source: "/categoria/platos-y-bowls", destination: "/categoria/vajilla", permanent: true }, { source: "/categoria/vajilla-blanca", destination: "/categoria/vajilla?tipo=blanca", permanent: true }, { source: "/categoria/gres", destination: "/categoria/vajilla?tipo=gres", permanent: true }, { source: "/categoria/vajilla-decorada", destination: "/categoria/vajilla?tipo=decorada", permanent: true }, { source: "/categoria/exterior-lounge", destination: "/categoria/exterior", permanent: true }, { source: "/categoria/sets", destination: "/categoria/mobiliario", permanent: false }, { source: "/categoria/asado-y-parrilla", destination: "/categoria/cubiertos", permanent: true }, { source: "/categoria/vajilla-marmolada", destination: "/categoria/vajilla?tipo=decorada", permanent: true }, { source: "/favoritos", destination: "/catalogo", permanent: false }, { source: "/categoria/mesas-auxiliares", destination: "/categoria/mesas", permanent: true }];
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
