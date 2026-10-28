import { currentUserId, post } from "./client";

/** Creates a user of any role (vendors and workers are users too). */
export const createUser = (u: { name: string; email: string; phone: string; password: string; role: string; vendor_id: number | null; building_id: number | null }) =>
  post<unknown>("users/createUser", { ...u, created_by: currentUserId() });

/** Creates a vendor company together with its sign-in user, mapped to the given sites. */
export const createVendor = (v: { company_name: string; contact_phone: string; user_name: string; user_email: string; password: string; building_ids: number[] }) =>
  post<unknown>("users/createVendor", { ...v, created_by: currentUserId() });
