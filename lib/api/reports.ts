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

/** Month-based reports served from `complaint-types/*` (`month` is `YYYY-MM`). */
export const getComplaintRegisterReport = (q: { month: string; vendor_id?: number; search?: string; status?: string; category_id?: number; page: number; limit: number }) =>
  call<unknown>("complaint-types/getComplaintRegisterReport", {
    user_id: currentUserId(),
    month: q.month,
    vendor_id: q.vendor_id ?? "",
    category_id: q.category_id ?? "",
    status: q.status ?? "ALL",
    search: q.search ?? "",
    page: q.page,
    limit: q.limit,
    export: 0,
  });

export const getSatisfactionReport = (q: { month: string; vendor_id?: number }) =>
  call<unknown>("complaint-types/getSatisfactionReport", { user_id: currentUserId(), month: q.month, vendor_id: q.vendor_id ?? "" });

export const getBenchmarkReport = (q: { month: string; vendor_id?: number }) =>
  call<unknown>("complaint-types/getBenchmarkReport", { user_id: currentUserId(), month: q.month, vendor_id: q.vendor_id ?? "" });

/** Admin waives the fine on a complaint. */
export const waiveFine = (complaintId: number, remarks: string) =>
  call<unknown>("complaint-types/waiveFine", { user_id: currentUserId(), complaint_id: complaintId, remarks });
