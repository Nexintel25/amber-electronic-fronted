import { call, currentUserId, post } from "./client";
import type { ComplaintDetail, ComplaintRow, MediaItem } from "./types";

export const createComplaint = (c: {
  building_id: number;
  category_id: number;
  complaint_type_id: number;
  title: string;
  description: string;
  area_location: string;
  asset_code?: string;
  preferred_visit?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  contact_name?: string;
  contact_phone?: string;
  media: MediaItem[];
  is_draft?: boolean;
}) => post<{ complaint_id?: number; complaint_no?: string; [k: string]: unknown }>("users/createComplaint", { ...c, user_id: currentUserId(), created_by: currentUserId(), is_draft: c.is_draft ? 1 : 0 });

/** Returns the full envelope so callers can read `pagination`. */
export const getComplaints = (f: { status?: string; building_id?: number; search?: string; page?: number; limit?: number } = {}) =>
  call<ComplaintRow[]>("complaints/getComplaints", { user_id: currentUserId(), page: 1, limit: 100, ...f });

export const getComplaintDetail = (complaintId: number) =>
  post<ComplaintDetail>("complaints/getComplaintDetail", { user_id: currentUserId(), complaint_id: complaintId });

/** Vendor assigns a complaint to one of their workers. */
export const assignWorker = (complaintId: number, workerId: number, remarks: string) =>
  post<unknown>("complaints/assignWorker", { user_id: currentUserId(), complaint_id: complaintId, worker_id: workerId, remarks, updated_by: currentUserId() });

/** Complaint creator tells us whether the finished work satisfied them. */
export const recordComplaintFeedback = (complaintId: number, satisfied: boolean, remarks: string) =>
  post<unknown>("complaint-types/recordComplaintFeedback", { user_id: currentUserId(), complaint_id: complaintId, satisfied: satisfied ? 1 : 0, remarks });
