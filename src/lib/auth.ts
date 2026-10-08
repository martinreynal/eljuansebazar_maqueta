import "server-only";
import type { User } from "@supabase/supabase-js";
import { hasSupabase } from "./env";
import { serverClient } from "./supabase/server";

type Sb = Awaited<ReturnType<typeof serverClient>>;
export type AdminState =
  | { state: "no-config" }
  | { state: "anon" }
  | { state: "forbidden"; user: User }
  | { state: "admin"; user: User; sb: Sb };

export async function getAdmin(): Promise<AdminState> {
  if (!hasSupabase) return { state: "no-config" };
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { state: "anon" };
  const { data } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? { state: "admin", user, sb } : { state: "forbidden", user };
}

/** Para acciones del servidor: corta si quien llama no es administrador. */
export async function requireAdmin(): Promise<Sb> {
  const a = await getAdmin();
  if (a.state !== "admin") throw new Error("No tenés permisos para hacer este cambio. Volvé a iniciar sesión.");
  return a.sb;
}
