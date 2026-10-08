import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Ingresar al panel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const a = await getAdmin();
  if (a.state === "admin") redirect("/admin/productos");
  return (
    <div className="wrap">
      <div className="login">
        {a.state === "no-config" ? (
          <div className="panel"><h3>Falta conectar Supabase</h3><p className="hint">Cargá las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (ver README) y volvé a publicar.</p></div>
        ) : (
          <LoginForm forbidden={a.state === "forbidden" ? a.user.email ?? "" : ""} />
        )}
      </div>
    </div>
  );
}
