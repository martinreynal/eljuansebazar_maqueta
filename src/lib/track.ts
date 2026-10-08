"use client";
import type { EventType, WaChannel } from "./types";

/** Registra una interacción anónima (sin datos personales). Nunca bloquea la navegación. */
export function track(type: EventType, data: { channel?: WaChannel; product_id?: string; category_id?: string } = {}) {
  try {
    if (data.product_id?.startsWith("demo-") || data.category_id?.startsWith("demo-")) return;
    const body = JSON.stringify({ type, ...data });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch {
    /* las estadísticas nunca deben romper la página */
  }
}
