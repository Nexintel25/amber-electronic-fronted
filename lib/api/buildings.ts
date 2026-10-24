import { currentUserId, post } from "./client";
import type { Building } from "./types";

/** Sites the signed-in user can see. */
export const getBuildings = (search = "", onlyActive = true) =>
  post<Building[]>("complaint-types/getBuildings", { user_id: currentUserId(), only_active: onlyActive ? 1 : 0, search });

/** Creates a site together with its sign-in user. */
export const createBuildingWithUser = (b: {
  building_name: string;
  building_code: string;
  address: string;
  city: string;
  sla_enabled: boolean;
  user_name: string;
  user_email: string;
  user_phone: string;
  password: string;
  vendor_id: number | null;
}) => post<unknown>("buildings/createBuildingWithUser", { ...b, created_by: currentUserId() });
