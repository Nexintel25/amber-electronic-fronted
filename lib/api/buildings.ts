import { call, currentUserId, post } from "./client";
import type { Row } from "./shape";
import type { Building } from "./types";

/** Sites the signed-in user can see. */
export const getBuildings = (search = "", onlyActive = true) =>
  post<Building[]>("complaint-types/getBuildings", { user_id: currentUserId(), only_active: onlyActive ? 1 : 0, search }).then(uniqueById);

/** The endpoint can return the same building more than once; keep the first row per id so list keys stay unique. */
const uniqueById = (rows: Building[]) => (Array.isArray(rows) ? rows.filter((b, i) => rows.findIndex((x) => x.id === b.id) === i) : rows);

/** Adds buildings to an existing client organisation (its Complaint Creator and Client Admin get access to them). */
export const addOrgBuildings = (b: { creator_user_id: number; admin_user_id: number; vendor_id: number | null; code_prefix: string; city: string; buildings: string[] }) =>
  post<unknown>("buildings/addOrgBuildings", { ...b, created_by: currentUserId() });

/** Super Admin audit trail. Returns the envelope so callers can read `pagination`; `export` returns every matching row. */
export const getAuditLogs = (f: { search?: string; source?: string; action?: string; actor_id?: number; from_date?: string; to_date?: string; page: number; limit: number; export?: boolean }) =>
  call<unknown>("buildings/getAuditLogs", {
    user_id: currentUserId(),
    search: f.search?.trim() || "",
    source: f.source || "",
    action: f.action || "",
    actor_id: f.actor_id ?? null,
    from_date: f.from_date || "",
    to_date: f.to_date || "",
    page: f.page,
    limit: f.limit,
    export: f.export ? 1 : 0,
  });

/** Full detail of one worker for the Project Manager's monitoring view. */
export const getPmWorkerDetail = (workerId: number) => post<Row>("buildings/getPmWorkerDetail", { user_id: currentUserId(), worker_id: workerId });

/** Admin: replaces the set of vendors a Project Manager is responsible for. */
export const setPmVendors = (pmId: number, vendorIds: number[]) => post<unknown>("buildings/setPmVendors", { user_id: currentUserId(), pm_id: pmId, vendor_ids: vendorIds });
