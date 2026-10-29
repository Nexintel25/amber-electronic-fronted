import { call, currentUserId, post } from "./client";
import type { Row } from "./shape";

/** Creates a user of any role (vendors and workers are users too). */
export const createUser = (u: { name: string; email: string; phone: string; password: string; role: string; vendor_id: number | null; building_id: number | null }) =>
  post<unknown>("users/createUser", { ...u, created_by: currentUserId() });

/** Creates a vendor company together with its sign-in user, mapped to the given sites. */
export const createVendor = (v: { company_name: string; contact_phone: string; user_name: string; user_email: string; password: string; building_ids: number[] }) =>
  post<unknown>("users/createVendor", { ...v, created_by: currentUserId() });

/** Every user, filterable and paged. Returns the envelope so callers can read `pagination`. */
export const getAllUsers = (f: { role?: string; status?: string; vendor_id?: number; building_id?: number; search?: string; page: number; limit: number }) =>
  call<Row[]>("complaints/getAllUsers", {
    user_id: currentUserId(),
    role: f.role || null,
    status: f.status || null,
    vendor_id: f.vendor_id ?? null,
    building_id: f.building_id ?? null,
    search: f.search?.trim() || null,
    page: f.page,
    limit: f.limit,
  });
