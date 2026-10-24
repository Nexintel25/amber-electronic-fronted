import type { VendorWorker } from "./api";

/** Normalised view of a worker row (the API's field names for these rows are not fixed). */
export function workerView(w: VendorWorker) {
  const id = Number(w.worker_id ?? w.user_id ?? w.id);
  return { id, name: String(w.name ?? w.worker_name ?? `Worker #${id}`), phone: w.phone ? String(w.phone) : null, email: w.email ? String(w.email) : null, active: w.is_active !== 0 };
}
