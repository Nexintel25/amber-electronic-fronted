export type StatusKey =
  | "new"
  | "vendor_review"
  | "worker_assigned"
  | "in_progress"
  | "pending_verification"
  | "issue_raised"
  | "rework"
  | "closed"
  | "rejected";

export type Priority = "Critical" | "High" | "Medium" | "Low";

/** Contractual completion window: a vendor that exceeds it is penalised. */
export const PENALTY_AFTER_DAYS = 15;
/** Penalty charged for every day beyond the window (INR). */
export const PENALTY_PER_DAY = 1000;

/**
 * The seven stages every complaint passes through.
 * Complaint → (Vendor + Admin + PM notified) → Vendor distributes to Worker → Worker uploads photos
 * → Vendor & Admin see them (Admin can raise an issue, visible to the Vendor only) → Vendor verifies or sends rework.
 */
export const WORKFLOW = [
  { step: 1, key: "new", label: "Complaint Raised", owner: "Complaint Creator", action: "Creator raises the complaint — Vendor, Admin and Project Manager are notified together", statuses: ["new"] },
  { step: 2, key: "vendor_review", label: "Vendor Review", owner: "Vendor", action: "Vendor reviews the details and accepts or rejects the complaint", statuses: ["vendor_review"] },
  { step: 3, key: "worker_assigned", label: "Work Distributed", owner: "Vendor", action: "Vendor distributes the work to workers on the mobile app", statuses: ["worker_assigned"] },
  { step: 4, key: "in_progress", label: "Work In Progress", owner: "Worker", action: "Worker checks in via GPS and uploads before photos", statuses: ["in_progress"] },
  { step: 5, key: "pending_verification", label: "Photos Submitted", owner: "Worker", action: "Worker uploads after photos — Vendor and Admin see them", statuses: ["pending_verification"] },
  { step: 6, key: "issue_raised", label: "Verification / Rework", owner: "Vendor", action: "Admin may raise an issue (Vendor only); Vendor verifies or sends the work back for rework", statuses: ["issue_raised", "rework"] },
  { step: 7, key: "closed", label: "Closed", owner: "Vendor", action: "Vendor verifies the work and closes the complaint", statuses: ["closed"] },
] as const;

export const STATUS_META: Record<
  StatusKey,
  { label: string; step: number; badge: string; dot: string; bar: string }
> = {
  new: { label: "Complaint Raised", step: 1, badge: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500", bar: "#0ea5e9" },
  vendor_review: { label: "Vendor Review", step: 2, badge: "bg-violet-50 text-violet-700 ring-violet-600/15", dot: "bg-violet-500", bar: "#8b5cf6" },
  worker_assigned: { label: "Work Distributed", step: 3, badge: "bg-cyan-50 text-cyan-700 ring-cyan-600/15", dot: "bg-cyan-500", bar: "#06b6d4" },
  in_progress: { label: "Work In Progress", step: 4, badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500", bar: "#f59e0b" },
  pending_verification: { label: "Photos Submitted", step: 5, badge: "bg-orange-50 text-orange-700 ring-orange-600/20", dot: "bg-orange-500", bar: "#f97316" },
  issue_raised: { label: "Issue Raised", step: 6, badge: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15", dot: "bg-fuchsia-500", bar: "#d946ef" },
  rework: { label: "Rework Required", step: 6, badge: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500", bar: "#f43f5e" },
  closed: { label: "Closed", step: 7, badge: "bg-slate-100 text-slate-700 ring-slate-500/15", dot: "bg-slate-500", bar: "#64748b" },
  rejected: { label: "Rejected", step: 2, badge: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500", bar: "#ef4444" },
};

/** Resolution target in hours, counted from the moment the Complaint Creator raises the complaint. */
export const SLA_HOURS: Record<Priority, number> = { Critical: 4, High: 8, Medium: 24, Low: 72 };

export const PRIORITY_META: Record<Priority, { badge: string; dot: string; sla: string }> = {
  Critical: { badge: "bg-red-600 text-white ring-red-700/20", dot: "bg-red-600", sla: "4 hrs" },
  High: { badge: "bg-orange-100 text-orange-800 ring-orange-600/20", dot: "bg-orange-500", sla: "8 hrs" },
  Medium: { badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/20", dot: "bg-yellow-500", sla: "24 hrs" },
  Low: { badge: "bg-slate-100 text-slate-700 ring-slate-500/15", dot: "bg-slate-400", sla: "72 hrs" },
};
