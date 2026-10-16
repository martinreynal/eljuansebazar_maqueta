import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ujhzhyraalxcblchnztu.supabase.co").hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
  },
  serverExternalPackages: ["@resvg/resvg-js", "@react-pdf/renderer"],
  poweredByHeader: false,
  outputFileTracingIncludes: { "/catalogo.pdf": ["./public/logo-light.png", "./public/catalogo/mini/**"] },
  // El simulador 3D es una app estática (Vite) servida desde /public/simulador
  async rewrites() {
    return [{ source: "/simulador", destination: "/simulador/index.html" }];
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
