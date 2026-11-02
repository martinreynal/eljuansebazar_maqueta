"use server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";

export type ScoreRow = { email: string; score: number; level: number; day: string };
export type Ranking = { normal: ScoreRow[]; diario: ScoreRow[] };

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

/** Ranking de sagg.io: mejores puntajes generales y del desafío del día. */
export async function saggioRanking(): Promise<Ranking> {
  const a = await getAdmin();
  if (a.state !== "admin") return { normal: [], diario: [] };
  const [n, d] = await Promise.all([
    a.sb.from("saggio_scores").select("email, score, level, day").eq("mode", "normal").order("score", { ascending: false }).limit(10),
    a.sb.from("saggio_scores").select("email, score, level, day").eq("mode", "diario").eq("day", today()).order("score", { ascending: false }).limit(10),
  ]);
  return { normal: (n.data ?? []) as ScoreRow[], diario: (d.data ?? []) as ScoreRow[] };
}

const Input = z.object({ score: z.number().int().min(0).max(999999), mode: z.enum(["normal", "diario"]), level: z.number().int().min(1).max(10) });

export async function saggioSubmit(input: z.input<typeof Input>): Promise<Ranking> {
  const p = Input.safeParse(input);
  const a = await getAdmin();
  if (p.success && a.state === "admin" && p.data.score > 0) {
    await a.sb.from("saggio_scores").insert({ ...p.data, email: a.user.email ?? "admin", day: today() });
  }
  return saggioRanking();
}
