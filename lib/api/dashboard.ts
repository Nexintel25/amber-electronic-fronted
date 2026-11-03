import { currentUserId, post } from "./client";
import type { AdminDashboard, ClientAdminDashboard, CreatorDashboard, PmDashboard, WorkerDashboard } from "./types";

export const getAdminDashboard = () => post<AdminDashboard>("buildings/getAdminDashboard", { user_id: currentUserId() });

export const getPmDashboard = () => post<PmDashboard>("buildings/getPmDashboard", { user_id: currentUserId() });

export const getCreatorDashboard = (p: { only_mine?: boolean; active_limit?: number } = {}) =>
  post<CreatorDashboard>("complaint-types/getCreatorDashboard", { user_id: currentUserId(), only_mine: p.only_mine ? 1 : 0, active_limit: p.active_limit ?? 5 });

export const getWorkerDashboard = (jobsLimit = 10) =>
  post<WorkerDashboard>("complaint-types/getWorkerDashboard", { user_id: currentUserId(), jobs_limit: jobsLimit });

/** Public platform figures for the landing page; needs no sign-in. */
export type PublicOverview = {
  kpis: { open_now: number; resolved_today: number; sla_compliance_pct: number | null; complaints_managed: number; avg_resolution_hours: number | null; sites_connected: number };
  last_10_days: { day: string; raised: number; resolved: number }[];
  open_by_category: Record<string, unknown>[];
};
export const getPublicOverview = () => post<PublicOverview>("complaints/getPublicOverview", {}, { auth: false });

export const getClientAdminDashboard = () => post<ClientAdminDashboard>("complaint-types/getClientAdminDashboard", { user_id: currentUserId() });
