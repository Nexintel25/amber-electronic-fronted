import { currentUserId, post } from "./client";
import type { MediaItem } from "./types";

export const workerCheckin = (complaintId: number, p: { latitude: number; longitude: number; accuracy_m?: number }) =>
  post<unknown>("complaints/workerCheckin", { user_id: currentUserId(), complaint_id: complaintId, updated_by: currentUserId(), ...p });

/** Starts the job with the "before" photos. */
export const workerStart = (complaintId: number, media: MediaItem[]) =>
  post<unknown>("complaints/workerStart", { user_id: currentUserId(), complaint_id: complaintId, updated_by: currentUserId(), media });

/** Submits the job with the "after" photos. */
export const workerSubmit = (complaintId: number, note: string, media: MediaItem[]) =>
  post<unknown>("complaints/workerSubmit", { user_id: currentUserId(), complaint_id: complaintId, updated_by: currentUserId(), note, media });
