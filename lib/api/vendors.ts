import { currentUserId, post } from "./client";
import type { Vendor, VendorWorker } from "./types";

export const getVendors = (search = "", onlyActive = true) =>
  post<Vendor[]>("complaint-types/getVendors", { user_id: currentUserId(), only_active: onlyActive ? 1 : 0, search });

export const getVendorWorkers = (vendorId: number) =>
  post<VendorWorker[]>("complaints/getVendorWorkers", { user_id: currentUserId(), vendor_id: vendorId });
