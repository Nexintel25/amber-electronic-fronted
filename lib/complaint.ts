import { PENALTY_AFTER_DAYS, PENALTY_PER_DAY, type Priority, type StatusKey } from "./workflow";

/** UI model of a complaint, filled from the API (see lib/api/mappers.ts). */
export type Complaint = {
  id: string;
  /** API complaint_id, used in URLs and API calls. Absent on the built-in sample data. */
  ref?: string;
  vendorId?: number;
  title: string;
  description: string;
  category: string;
  site: string;
  location: string;
  asset: string;
  priority: Priority;
  status: StatusKey;
  raisedBy: string;
  raisedAt: string;
  updatedAt: string;
  deadline?: string;
  vendor?: string;
  pm?: string;
  workers?: string[];
  team?: string;
  media: { photos: number; videos: number };
  lat: number;
  lng: number;
  slaLeft?: string;
  slaRisk?: boolean;
  /** Resolution target from the API, e.g. "3 hours". */
  slaLabel?: string;
  /** Whole days the SLA allows. */
  slaDays?: number;
  /** Minutes left to the deadline (negative once overdue). */
  timeLeftMinutes?: number;
  /** Time taken so far, from `raised_at`. */
  raisedAtIso?: string;
  /** Whole days since the complaint was raised (as of 24 Sep 2026). */
  daysOpen: number;
  /** Days the vendor took to close it, if already closed. */
  closedAfterDays?: number;
  /** Issue raised by Admin after reviewing the photos — visible to the Vendor only. */
  issue?: { by: string; text: string; time: string };
};

export type Penalty = {
  complaint: Complaint;
  pm?: string;
  /** Days taken (or elapsed so far for an open complaint). */
  days: number;
  overdueDays: number;
  amount: number;
  /** "Levied" = complaint closed late, "Accruing" = still open past the window, "At risk" = inside the last 3 days. */
  state: "Levied" | "Accruing" | "At risk" | "Clear";
  daysLeft: number;
};

export function penaltyOf(c: Complaint): Penalty {
  const closed = c.status === "closed";
  const days = closed ? (c.closedAfterDays ?? c.daysOpen) : c.daysOpen;
  const overdueDays = c.status === "rejected" ? 0 : Math.max(0, days - PENALTY_AFTER_DAYS);
  const daysLeft = PENALTY_AFTER_DAYS - days;
  const state: Penalty["state"] =
    overdueDays > 0 ? (closed ? "Levied" : "Accruing") : !closed && c.status !== "rejected" && daysLeft <= 3 ? "At risk" : "Clear";
  return { complaint: c, pm: c.pm, days, overdueDays, amount: overdueDays * PENALTY_PER_DAY, state, daysLeft };
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export type NotificationType = "new" | "assigned" | "progress" | "verify" | "rework" | "closed" | "sla" | "system";
