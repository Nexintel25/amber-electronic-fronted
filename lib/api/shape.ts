/** Helpers for list responses whose exact shape is not fixed (array, or an object wrapping the array). */
export type Row = Record<string, unknown>;

const WRAP_KEYS = ["rows", "data", "items", "list", "tickets", "complaints", "report", "records", "results"];

/** The array of rows inside a response, wherever the backend put it. */
export function rowsOf(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];
  if (data && typeof data === "object") {
    const o = data as Row;
    for (const k of WRAP_KEYS) if (Array.isArray(o[k])) return o[k] as Row[];
    const first = Object.values(o).find(Array.isArray);
    if (first) return first as Row[];
  }
  return [];
}

/** The `summary` object of a response, if any. */
export function summaryOf(data: unknown): Row | null {
  const s = data && typeof data === "object" ? (data as Row).summary : null;
  return s && typeof s === "object" && !Array.isArray(s) ? (s as Row) : null;
}

/** First present value among `keys`. */
export function pick(row: Row | null | undefined, ...keys: string[]): unknown {
  if (!row) return undefined;
  for (const k of keys) if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
  return undefined;
}

export const text = (v: unknown, fallback = "—") => (v === undefined || v === null || v === "" ? fallback : typeof v === "object" ? JSON.stringify(v) : String(v));
export const num = (v: unknown) => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
