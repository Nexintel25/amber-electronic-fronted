import { currentUserId, post } from "./client";
import type { AdminDashboard, PmDashboard } from "./types";

export const getAdminDashboard = () => post<AdminDashboard>("buildings/getAdminDashboard", { user_id: currentUserId() });

export const getPmDashboard = () => post<PmDashboard>("buildings/getPmDashboard", { user_id: currentUserId() });
