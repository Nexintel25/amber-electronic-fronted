import { currentUserId, post } from "./client";

/** Creates a user of any role (vendors and workers are users too). */
export const createUser = (u: { name: string; email: string; phone: string; password: string; role: string; vendor_id: number | null; building_id: number | null }) =>
  post<unknown>("users/createUser", { ...u, created_by: currentUserId() });
