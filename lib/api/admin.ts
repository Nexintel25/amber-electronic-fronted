import { currentUserId, post } from "./client";

/** Platform health and activity for the Super Admin. `days` is the look-back window; `interval` is the bucket size of the time series. */
export const getSystemOverview = (days = 7, interval = 1) =>
  post<unknown>(`admin/system-overview?days=${days}&interval=${interval}`, { user_id: currentUserId(), days, interval });
