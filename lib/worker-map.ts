import { pick, num, text, type Row } from "./api";
import type { WorkerStatus } from "./worker-status";

export type MapWorker = {
  id: string;
  name: string;
  skill: string;
  team: string;
  site: string;
  status: WorkerStatus;
  battery: number | undefined;
  lastPing: string;
  lat?: number;
  lng?: number;
  x: number;
  y: number;
  task?: string;
};

export const toStatus = (v: unknown): WorkerStatus => {
  const t = String(v ?? "").toLowerCase();
  if (/task|busy|progress|work/.test(t)) return "On Task";
  if (/travel|route|transit/.test(t)) return "Travelling";
  if (/avail|idle|free|online/.test(t)) return "Available";
  return "Offline";
};

/** Worker row of a dashboard → UI model (the field names are not fixed, so several spellings are tried). */
export function toWorker(r: Row): MapWorker {
  return {
    id: String(pick(r, "worker_id", "user_id", "id") ?? ""),
    name: text(pick(r, "worker_name", "name")),
    skill: text(pick(r, "skill", "designation", "vendor_name")),
    team: text(pick(r, "team", "team_name")),
    site: text(pick(r, "building_name", "site"), ""),
    status: toStatus(pick(r, "status", "work_status", "availability")),
    battery: num(pick(r, "battery", "battery_pct", "battery_level")),
    lastPing: text(pick(r, "last_ping", "last_seen", "last_seen_at", "last_location_at")),
    lat: num(pick(r, "latitude", "lat")),
    lng: num(pick(r, "longitude", "lng")),
    x: 50,
    y: 50,
    task: pick(r, "complaint_no", "current_complaint_no") as string | undefined,
  };
}

/** Fits real lat/lng onto the 0–100 canvas the map uses. `bounds` come from every point shown together. */
export function projector(points: { lat?: number | null; lng?: number | null }[]) {
  const pts = points.filter((p) => p.lat != null && p.lng != null) as { lat: number; lng: number }[];
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
  const [la0, la1, ln0, ln1] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const at = (v: number, lo: number, hi: number) => (hi === lo ? 50 : 10 + ((v - lo) / (hi - lo)) * 80);
  return (lat?: number | null, lng?: number | null) => (lat != null && lng != null ? { x: at(lng, ln0, ln1), y: 100 - at(lat, la0, la1) } : { x: 50, y: 50 });
}
