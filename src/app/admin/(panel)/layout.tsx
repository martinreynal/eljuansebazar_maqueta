import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdmin } from "@/lib/auth";
import { signOut } from "../actions";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const a = await getAdmin();
  if (a.state === "no-config") redirect("/admin/login");
  if (a.state === "anon") redirect("/admin/login");
  if (a.state === "forbidden")
    return (
      <div className="wrap"><div className="login"><div className="panel">
        <h3>Sin permisos</h3>
        <p className="hint">La cuenta {a.user.email} inició sesión pero no está cargada como administradora.</p>
        <form action={signOut}><button className="btn btn-ghost" type="submit">Salir</button></form>
      </div></div></div>
    );
  return (
    <div className="wrap adm">
      <div className="adm-grid">
        <AdminNav email={a.user.email ?? ""} signOut={signOut} />
        <section style={{ minWidth: 0 }}>{children}</section>
      </div>
    </div>
  );
}
