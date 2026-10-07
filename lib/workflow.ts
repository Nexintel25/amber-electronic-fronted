export type StatusKey =
  | "new"
  | "vendor_review"
  | "assigned_pm"
  | "worker_assigned"
  | "in_progress"
  | "pending_verification"
  | "rework"
  | "completed"
  | "closed"
  | "rejected";

export type Priority = "Critical" | "High" | "Medium" | "Low";

/** The eight defined stages every complaint passes through (proposal §3). */
export const WORKFLOW = [
  { step: 1, key: "new", label: "New Complaint", owner: "Client / Admin", action: "Client / Admin raises complaint" },
  { step: 2, key: "vendor_review", label: "Vendor Review", owner: "Vendor", action: "Vendor reviews details and assigns PM" },
  { step: 3, key: "assigned_pm", label: "Assigned to Project Manager", owner: "Vendor", action: "Vendor sets PM, deadline & priority" },
  { step: 4, key: "worker_assigned", label: "Worker Assigned", owner: "Project Manager", action: "Project Manager allocates worker/team" },
  { step: 5, key: "in_progress", label: "Work In Progress", owner: "Worker", action: "Worker starts task, uploads before photos" },
  { step: 6, key: "pending_verification", label: "Pending Verification", owner: "Worker", action: "Worker marks complete, uploads after photos" },
  { step: 7, key: "completed", label: "Completed / Rework Required", owner: "Project Manager", action: "Project Manager verifies or sends back" },
  { step: 8, key: "closed", label: "Closed", owner: "Vendor", action: "Vendor final review and closure" },
] as const;

export const STATUS_META: Record<
  StatusKey,
  { label: string; step: number; badge: string; dot: string; bar: string }
> = {
  new: { label: "New Complaint", step: 1, badge: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500", bar: "#0ea5e9" },
  vendor_review: { label: "Vendor Review", step: 2, badge: "bg-violet-50 text-violet-700 ring-violet-600/15", dot: "bg-violet-500", bar: "#8b5cf6" },
  assigned_pm: { label: "Assigned to PM", step: 3, badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/15", dot: "bg-indigo-500", bar: "#6366f1" },
  worker_assigned: { label: "Worker Assigned", step: 4, badge: "bg-cyan-50 text-cyan-700 ring-cyan-600/15", dot: "bg-cyan-500", bar: "#06b6d4" },
  in_progress: { label: "Work In Progress", step: 5, badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500", bar: "#f59e0b" },
  pending_verification: { label: "Pending Verification", step: 6, badge: "bg-orange-50 text-orange-700 ring-orange-600/20", dot: "bg-orange-500", bar: "#f97316" },
  rework: { label: "Rework Required", step: 7, badge: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500", bar: "#f43f5e" },
  completed: { label: "Completed", step: 7, badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500", bar: "#10b981" },
  closed: { label: "Closed", step: 8, badge: "bg-slate-100 text-slate-700 ring-slate-500/15", dot: "bg-slate-500", bar: "#64748b" },
  rejected: { label: "Rejected", step: 2, badge: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500", bar: "#ef4444" },
};

export const PRIORITY_META: Record<Priority, { badge: string; dot: string; sla: string }> = {
  Critical: { badge: "bg-red-600 text-white ring-red-700/20", dot: "bg-red-600", sla: "4 hrs" },
  High: { badge: "bg-orange-100 text-orange-800 ring-orange-600/20", dot: "bg-orange-500", sla: "8 hrs" },
  Medium: { badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/20", dot: "bg-yellow-500", sla: "24 hrs" },
  Low: { badge: "bg-slate-100 text-slate-700 ring-slate-500/15", dot: "bg-slate-400", sla: "72 hrs" },
};
