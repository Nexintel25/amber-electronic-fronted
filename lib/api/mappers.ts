import type { Complaint } from "../complaint";
import type { Priority, StatusKey } from "../workflow";
import type { RoleKey } from "../roles";
import type { ComplaintDetail, ComplaintRow } from "./types";

/** Backend roles → panel. Unknown roles fall back to the creator portal (the least privileged one). */
export function roleKeyFromApi(role: string): RoleKey {
  switch (role.toLowerCase().replace(/[\s-]/g, "_")) {
    case "super_admin":
    case "superadmin":
      return "superadmin";
    case "admin":
      return "admin";
    case "pm":
    case "project_manager":
    case "projectmanager":
      return "pm";
    case "vendor":
      return "vendor";
    case "worker":
      return "worker";
    default:
      return "creator"; // "client" and anything else
  }
}

/** Panel → backend role string used by createUser. */
export const API_ROLE_BY_LABEL: Record<string, string> = {
  "Super Admin": "super_admin",
  Admin: "admin",
  "Project Manager": "project_manager",
  Vendor: "vendor",
  Worker: "worker",
  "Complaint Creator": "client",
};

const STATUS_BY_API: Record<string, StatusKey> = {
  NEW: "new",
  VENDOR_REVIEW: "vendor_review",
  WORKER_ASSIGNED: "worker_assigned",
  IN_PROGRESS: "in_progress",
  PENDING_APPROVAL: "pending_verification",
  REWORK_REQUIRED: "rework",
  CLOSED: "closed",
  REJECTED: "rejected",
};
export const statusFromApi = (s: string): StatusKey => STATUS_BY_API[s?.toUpperCase()] ?? "new";
/** Inverse of `statusFromApi`, used when filtering on the server. */
export const apiStatusOf = (s: StatusKey): string => Object.entries(STATUS_BY_API).find(([, v]) => v === s)?.[0] ?? "NEW";

/** The API has complaint *types* (Emergency/Major/…), the UI shows a priority. */
export function priorityFromType(name: string | null | undefined): Priority {
  switch ((name ?? "").toLowerCase()) {
    case "emergency":
      return "Critical";
    case "major":
      return "High";
    case "specialized":
      return "Medium";
    default:
      return "Low";
  }
}
export const typeForPriority = (p: Priority) => ({ Critical: "emergency", High: "major", Medium: "specialized", Low: "minor" })[p];

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const fmtDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : "—");

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
/** Table cell text: ISO timestamps (created_at, raised_at, …) are shown in Indian Standard Time, anything else as-is. */
export function timeText(v: unknown, fallback = "—"): string {
  if (typeof v === "string" && ISO_DATETIME.test(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return dateFmt.format(d);
  }
  return v === undefined || v === null || v === "" ? fallback : typeof v === "object" ? JSON.stringify(v) : String(v);
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} hr ago`;
  return `${Math.round(m / 1440)} d ago`;
}

function slaLeft(deadline: string | null, status: StatusKey): { slaLeft?: string; slaRisk?: boolean } {
  if (!deadline || status === "closed" || status === "rejected") return {};
  const ms = new Date(deadline).getTime() - Date.now();
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const txt = h >= 48 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
  return ms < 0 ? { slaLeft: `${txt} overdue`, slaRisk: true } : { slaLeft: txt, slaRisk: ms < 4 * 3600000 };
}

export function toComplaint(r: ComplaintRow): Complaint {
  const status = statusFromApi(r.status);
  return {
    id: r.complaint_no,
    ref: String(r.complaint_id),
    vendorId: r.vendor_id ?? undefined,
    title: r.title,
    description: "",
    category: r.category_name,
    site: r.building_name,
    location: r.area_location ?? "—",
    asset: r.asset_code ?? "—",
    priority: priorityFromType(r.complaint_type_name),
    status,
    raisedBy: "",
    raisedAt: fmtDate(r.raised_at),
    updatedAt: timeAgo(r.created_at),
    deadline: r.sla_applicable ? fmtDate(r.deadline) : undefined,
    vendor: r.vendor_name ?? undefined,
    workers: r.worker_name ? [r.worker_name] : undefined,
    media: { photos: r.photo_count ?? 0, videos: r.video_count ?? 0 },
    lat: 0,
    lng: 0,
    daysOpen: r.elapsed_days,
    slaLabel: r.sla_applicable ? (r.sla_label ?? undefined) : undefined,
    slaDays: r.sla_applicable ? r.sla_days : undefined,
    timeLeftMinutes: r.sla_applicable ? (r.time_left_minutes ?? undefined) : undefined,
    raisedAtIso: r.raised_at,
    ...slaLeft(r.sla_applicable ? r.deadline : null, status),
  };
}

export function toComplaintFromDetail(d: ComplaintDetail): Complaint {
  const base = toComplaint(d);
  const closedAt = d.closed_at ? new Date(d.closed_at).getTime() : null;
  return {
    ...base,
    description: d.description ?? "",
    raisedBy: d.raised_by_name,
    lat: Number(d.latitude ?? 0),
    lng: Number(d.longitude ?? 0),
    media: {
      photos: d.media.filter((m) => m.kind === "photo" && (m.type ?? "initial") === "initial").length,
      videos: d.media.filter((m) => m.kind === "video" && (m.type ?? "initial") === "initial").length,
    },
    closedAfterDays: closedAt ? Math.max(0, Math.round((closedAt - new Date(d.raised_at).getTime()) / 86400000)) : undefined,
    issue: undefined,
  };
}
