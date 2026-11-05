import { ChangeLog, type ChangeRow } from "@/components/admin/ChangeLog";
import { getAdmin } from "@/lib/auth";

export const metadata = { title: "Textos · Historial de cambios" };
export const dynamic = "force-dynamic";

/** Panel · Textos: historial de todos los cambios hechos en la web (panel, Claude y notas a mano). */
export default async function TextosAdmin() {
  const a = await getAdmin();
  if (a.state !== "admin") return null;
  const { data } = await a.sb.from("change_log").select("id, created_at, author, source, area, title, detail, ref").order("created_at", { ascending: false }).limit(1000);
  return <ChangeLog rows={(data ?? []) as ChangeRow[]} />;
}
