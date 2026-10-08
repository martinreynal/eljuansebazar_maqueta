import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabase } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";

const uuid = z.string().uuid();
const Event = z.object({
  type: z.enum(["product_view", "wa_click", "category_view", "list_send"]),
  channel: z.enum(["product", "list", "general", "custom", "quote"]).optional(),
  product_id: uuid.optional(),
  category_id: uuid.optional(),
});

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp/i;

/** Registra eventos anónimos para las estadísticas del panel. */
export async function POST(req: Request) {
  if (!hasSupabase) return new NextResponse(null, { status: 204 });
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  const text = await req.text();
  if (text.length > 500) return new NextResponse(null, { status: 413 });
  let parsed;
  try {
    parsed = Event.safeParse(JSON.parse(text));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const { error } = await publicClient().from("events").insert(parsed.data);
  return new NextResponse(null, { status: error ? 500 : 204 });
}
