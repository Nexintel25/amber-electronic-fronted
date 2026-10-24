import { currentUserId, post } from "./client";
import type { BuildingComplaintType, Category, ComplaintType } from "./types";

export const getComplaintTypes = () => post<ComplaintType[]>("complaint-types/getComplaintTypes");

export const getComplaintCategories = () => post<Category[]>("complaints/getComplaintCategories", { only_active: 1 });

/** Complaint types (and their SLA) that apply to one site. */
export const getBuildingComplaintTypes = (buildingId: number) =>
  post<{
    building: { building_id: number; building_name: string; sla_enabled: number; vendor_id: number | null; vendor_name: string | null };
    complaint_types: BuildingComplaintType[];
  }>("complaints/getBuildingComplaintTypes", { user_id: currentUserId(), building_id: buildingId });
