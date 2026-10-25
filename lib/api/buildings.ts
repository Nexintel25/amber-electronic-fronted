import { currentUserId, post } from "./client";
import type { Row } from "./shape";
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

/** Full detail of one worker for the Project Manager's monitoring view. */
export const getPmWorkerDetail = (workerId: number) => post<Row>("buildings/getPmWorkerDetail", { user_id: currentUserId(), worker_id: workerId });

/** Admin: replaces the set of vendors a Project Manager is responsible for. */
export const setPmVendors = (pmId: number, vendorIds: number[]) => post<unknown>("buildings/setPmVendors", { user_id: currentUserId(), pm_id: pmId, vendor_ids: vendorIds });
