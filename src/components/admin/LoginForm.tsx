"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, LogIn } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";

export function LoginForm({ forbidden }: { forbidden: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(forbidden ? `La cuenta ${forbidden} no tiene permisos de administrador.` : "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Completá el email y la clave.");
    setBusy(true);
    const sb = browserClient();
    const { data, error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (err || !data.user) {
      setBusy(false);
      return setError(err?.message === "Invalid login credentials" ? "El email o la clave no son correctos." : err?.message ?? "No se pudo ingresar.");
    }
    const { data: adm } = await sb.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
    if (!adm) {
      await sb.auth.signOut();
      setBusy(false);
      return setError("Esta cuenta no tiene permisos de administrador.");
    }
    router.replace("/admin/productos");
    router.refresh();
  };

  return (
    <form className="panel" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
      <h3 style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}><Lock />Panel administrador</h3>
      <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field"><label htmlFor="password">Clave</label><input className="input" id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {error && <span className="err" role="alert">{error}</span>}
      <button className="btn btn-dark btn-block" type="submit" disabled={busy}>{busy ? <Loader2 className="spin" /> : <LogIn />}Ingresar</button>
    </form>
  );
}
