import { call, currentUserId } from "./client";

export type ReportQuery = {
  report_type: string;
  from_date?: string;
  to_date?: string;
  date_by?: string;
  vendor_id?: number;
  search?: string;
  page: number;
  limit: number;
  export?: boolean;
};

/** Penalty (and other) reports, filtered and paged on the server. */
export const getPenaltyReport = (q: ReportQuery) =>
  call<unknown>("buildings/getPenaltyReport", {
    user_id: currentUserId(),
    report_type: q.report_type,
    date_by: q.date_by ?? "raised",
    search: q.search ?? "",
    page: q.page,
    limit: q.limit,
    export: q.export ? 1 : 0,
    ...(q.from_date ? { from_date: q.from_date } : {}),
    ...(q.to_date ? { to_date: q.to_date } : {}),
    ...(q.vendor_id ? { vendor_id: q.vendor_id } : {}),
  });
