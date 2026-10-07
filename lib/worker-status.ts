import type { WorkerStatus } from "./data";

export const WORKER_STATUS: Record<WorkerStatus, { tone: "green" | "amber" | "blue" | "slate"; badge: string; dot: string }> = {
  "On Task": { tone: "amber", badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  Travelling: { tone: "blue", badge: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500" },
  Available: { tone: "green", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
  Offline: { tone: "slate", badge: "bg-slate-100 text-slate-600 ring-slate-500/15", dot: "bg-slate-400" },
};
