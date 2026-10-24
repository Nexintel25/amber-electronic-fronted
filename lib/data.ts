import { penaltyOf, type Complaint, type NotificationType } from "./complaint";
import type { WorkerStatus } from "./worker-status";

export { inr, penaltyOf, type Complaint, type NotificationType, type Penalty } from "./complaint";
export type { WorkerStatus } from "./worker-status";

/*
 * No sample data lives here. These collections are empty until their API is connected,
 * so every page keeps its full layout and shows "No data found" / "—" in place of values.
 */

export type Site = { id: string; name: string; region: string; users: number; open: number; workers: number; pms: number; geofence: number; lat: number; lng: number };
export type Vendor = { id: string; name: string; contact: string; pm: string; workers: number; assigned: number; closed: number; avgTat: number; sla: number; rating: number; rework: number };
export type Admin = { id: string; name: string; scope: string; pms: string[] };
export type Pm = { id: string; name: string; admin: string; site: string; vendors: string[]; active: number; capacity: number; teams: string[] };
export type Worker = {
  id: string; name: string; vendor: string; skill: string; team: string; site: string; status: WorkerStatus; battery: number; lastPing: string;
  x: number; y: number; task?: string; tasksToday: number; completed: number; avgTime: string; ftf: number; photoCompliance: number; rating: number; distance: string;
};
export type AuditLog = { id: string; time: string; user: string; role: string; action: string; entity: string; ip: string; device: string; severity: string };
export type PlatformUser = { id: string; name: string; email: string; role: string; site: string; org: string; reportsTo: string; status: string; lastActive: string };
export type Notice = { id: string; type: NotificationType; title: string; body: string; time: string; day: "Today" | "Yesterday" | "Earlier"; read: boolean; link?: string };
export type PhotoSet = { id: string; complaint: string; worker: string; site: string; before: number; after: number; gps: string; inFence: boolean; time: string; status: string };

export const USER_CAP_PER_SITE = 0;
export const SITES: Site[] = [];
export const VENDORS: Vendor[] = [];
export const ADMINS: Admin[] = [];
export const PMS: Pm[] = [];
export const WORKERS: Worker[] = [];
export const TEAMS: { id: string; name: string; focus: string; lead: string; vendor: string; site: string; members: string[]; utilization: number; open: number }[] = [];
export const CATEGORIES: string[] = [];
export const COMPLAINTS: Complaint[] = [];
export const NOTIFICATIONS: Notice[] = [];
export const AUDIT_LOGS: AuditLog[] = [];
export const USERS: PlatformUser[] = [];
export const PHOTO_SETS: PhotoSet[] = [];

export const TREND_14D: { day: string; raised: number; resolved: number }[] = [];
export const CATEGORY_SPLIT: { name: string; value: number }[] = [];
export const PIPELINE_COUNTS: { key: string; count: number }[] = [];
export const HOURLY_TODAY: { hour: string; raised: number; closed: number }[] = [];
export const RESOLUTION_BUCKETS: { bucket: string; count: number }[] = [];
export const SLA_BY_SITE: { site: string; sla: number }[] = [];
export const PRIORITY_MIX: { name: string; value: number }[] = [];

export const getComplaint = (id: string) => COMPLAINTS.find((c) => c.id === id);

/** The Project Manager responsible for a vendor. */
export const pmOfVendor = (vendor?: string) => VENDORS.find((v) => v.name === vendor)?.pm;

/** Penalty rows for every vendor-owned complaint that is late or about to be. */
export function allPenalties() {
  return COMPLAINTS.filter((c) => c.vendor && c.status !== "rejected")
    .map(penaltyOf)
    .filter((p) => p.state !== "Clear")
    .sort((a, b) => b.amount - a.amount || a.daysLeft - b.daysLeft);
}
