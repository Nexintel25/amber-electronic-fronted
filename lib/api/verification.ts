import { call, currentUserId, post } from "./client";
import type { Row } from "./shape";

/** Complaints whose worker photos wait for the vendor. */
export const getVendorVerificationList = (f: { view: string; search?: string; building_id?: number; worker_id?: number; page: number; limit: number }) =>
  call<Row[]>("complaints/getVendorVerificationList", {
    user_id: currentUserId(),
    view: f.view,
    search: f.search ?? "",
    page: f.page,
    limit: f.limit,
    ...(f.building_id ? { building_id: f.building_id } : {}),
    ...(f.worker_id ? { worker_id: f.worker_id } : {}),
  });

export const vendorApprove = (complaintId: number, remarks: string) =>
  post<unknown>("buildings/vendorApprove", { user_id: currentUserId(), complaint_id: complaintId, remarks });

export const vendorRework = (complaintId: number, reason: string, workerId: number) =>
  post<unknown>("buildings/vendorRework", { user_id: currentUserId(), complaint_id: complaintId, reason, worker_id: workerId });
