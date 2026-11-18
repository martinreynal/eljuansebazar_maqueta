/** Contracara (datos internos de compra, logística y planilla INGES): tipos y cálculos compartidos por el panel. */

export type SourcingRow = {
  product_id: string; supplier: string; link: string; cost: number | null; currency: "USD" | "ARS" | "CNY" | "EUR"; moq: number | null; lead_time: string;
  units_per_box: number | null; box_volume_m3: number | null; box_weight_kg: number | null; box_dimensions: string; material_measures: string;
  certifications: string; restock: string; photos_authorized: "" | "si" | "no" | "consultar"; photos_note: string; notes: string; updated_at: string; updated_by: string;
  // Planilla de clasificación INGES
  inges_order: string; customs_name: string; customs_description: string; origin: string; operating_details: string; material_composition: string;
  sample: string; customs_notes: string; total_pcs: number | null; total_cartons: number | null; total_cbm: number | null; fob_djai: number | null;
  net_weight_g: number | null; shipping_mode: "" | "maritimo" | "aereo"; loading_port: string; hs_code: string;
};
export type SourcingValues = Omit<SourcingRow, "product_id" | "updated_at" | "updated_by">;

export const EMPTY_SOURCING: SourcingValues = {
  supplier: "", link: "", cost: null, currency: "USD", moq: null, lead_time: "", units_per_box: null, box_volume_m3: null, box_weight_kg: null,
  box_dimensions: "", material_measures: "", certifications: "", restock: "", photos_authorized: "", photos_note: "", notes: "",
  inges_order: "", customs_name: "", customs_description: "", origin: "", operating_details: "", material_composition: "", sample: "", customs_notes: "",
  total_pcs: null, total_cartons: null, total_cbm: null, fob_djai: null, net_weight_g: null, shipping_mode: "", loading_port: "", hs_code: "",
};
export const valuesOf = (r?: Partial<SourcingRow> | null): SourcingValues =>
  ({ ...EMPTY_SOURCING, ...Object.fromEntries(Object.keys(EMPTY_SOURCING).map((k) => [k, r?.[k as keyof SourcingRow] ?? EMPTY_SOURCING[k as keyof SourcingValues]])) }) as SourcingValues;

export const PHOTOS: Record<string, string> = { si: "Sí", no: "No", consultar: "A consultar", "": "—" };
export const CUR: Record<string, string> = { USD: "US$", ARS: "$", CNY: "¥", EUR: "€" };

/** Número escrito a mano: «10.000» (miles), «0,085» o «0.085» (decimales). */
export const toNum = (v: unknown): number | null => {
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v ?? "").trim().replace(/\s/g, "");
  if (!s) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s);
  return isFinite(n) ? n : null;
};
export const fmtNum = (n: number | null | undefined, suf = "") => (n == null ? "—" : `${n.toLocaleString("es-AR")}${suf}`);
export const fmtMoney = (n: number | null | undefined, c: string) =>
  n == null ? "—" : `${CUR[c] ?? ""} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Planilla INGES: cajas = unidades ÷ unidades por caja; CBM = cajas × volumen por caja. */
export const calcCartons = (v: Pick<SourcingValues, "total_pcs" | "units_per_box">) => {
  const t = toNum(v.total_pcs), u = toNum(v.units_per_box);
  return t && u ? Math.ceil(t / u) : null;
};
export const calcCbm = (v: Pick<SourcingValues, "total_pcs" | "units_per_box" | "total_cartons" | "box_volume_m3">) => {
  const c = toNum(v.total_cartons) ?? calcCartons(v), m = toNum(v.box_volume_m3);
  return c && m ? Math.round(c * m * 1000) / 1000 : null;
};

const has = (r: Partial<SourcingValues>, k: keyof SourcingValues) => r[k] !== null && r[k] !== "" && r[k] !== undefined;
/** Los 10 datos de compra pedidos originalmente. */
export const BUY_FIELDS: (keyof SourcingValues)[] = ["link", "cost", "moq", "lead_time", "units_per_box", "box_volume_m3", "material_measures", "certifications", "restock", "photos_authorized"];
/** Los datos de la planilla INGES (la foto sale de la ficha del producto). */
export const INGES_FIELDS: (keyof SourcingValues)[] = ["customs_name", "customs_description", "origin", "material_composition", "total_pcs", "units_per_box", "total_cartons", "box_dimensions", "total_cbm", "cost", "net_weight_g", "shipping_mode", "loading_port", "lead_time"];
export const countFilled = (r: Partial<SourcingValues> | undefined, fields: (keyof SourcingValues)[]) => (r ? fields.filter((k) => has(r, k)).length : 0);
