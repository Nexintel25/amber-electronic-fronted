import { currentUserId, post } from "./client";
import type { AdminDashboard, CreatorDashboard, PmDashboard, WorkerDashboard } from "./types";

export const getAdminDashboard = () => post<AdminDashboard>("buildings/getAdminDashboard", { user_id: currentUserId() });

export const getPmDashboard = () => post<PmDashboard>("buildings/getPmDashboard", { user_id: currentUserId() });

export const getCreatorDashboard = (p: { only_mine?: boolean; active_limit?: number } = {}) =>
  post<CreatorDashboard>("complaint-types/getCreatorDashboard", { user_id: currentUserId(), only_mine: p.only_mine ? 1 : 0, active_limit: p.active_limit ?? 5 });

export const getWorkerDashboard = (jobsLimit = 10) =>
  post<WorkerDashboard>("complaint-types/getWorkerDashboard", { user_id: currentUserId(), jobs_limit: jobsLimit });
