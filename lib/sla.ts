import { COMPLAINTS, type Complaint } from "./data";
import { SLA_HOURS } from "./workflow";

/** Current time. */
export const NOW = new Date();

export type SlaState = "On track" | "At risk" | "Overdue" | "Met" | "Missed";

export type Sla = {
  complaint: Complaint;
  targetHours: number;
  raised: Date;
  due: Date;
  /** Minutes left until the SLA is breached (negative = past the duration). For closed complaints: target minus time taken. */
  leftMin: number;
  /** Share of the allowed duration already used, 0–100+. */
  usedPct: number;
  state: SlaState;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "24 Sep 2026, 09:12 AM" → Date. */
export function parseRaised(text: string): Date {
  const m = text.match(/(\d{1,2}) ([A-Za-z]{3}) (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)/);
  if (!m) return NOW;
  let h = Number(m[4]) % 12;
  if (m[6] === "PM") h += 12;
  return new Date(Number(m[3]), MONTHS.indexOf(m[2]), Number(m[1]), h, Number(m[5]));
}

export function slaOf(c: Complaint): Sla {
  const raised = parseRaised(c.raisedAt);
  const targetHours = SLA_HOURS[c.priority];
  const due = new Date(raised.getTime() + targetHours * 3600_000);
  const closed = c.status === "closed";
  const elapsedMin = closed ? (c.closedAfterDays ?? c.daysOpen) * 24 * 60 : (NOW.getTime() - raised.getTime()) / 60_000;
  const leftMin = Math.round(targetHours * 60 - elapsedMin);
  const usedPct = Math.max(0, (elapsedMin / (targetHours * 60)) * 100);
  const state: SlaState = closed
    ? leftMin >= 0 ? "Met" : "Missed"
    : leftMin <= 0 ? "Overdue" : leftMin <= Math.max(60, targetHours * 15) ? "At risk" : "On track";
  return { complaint: c, targetHours, raised, due, leftMin, usedPct, state };
}

/** SLA rows for the complaints that count (rejected ones are excluded). */
export function slaRows(scopeVendors?: string[]): Sla[] {
  return COMPLAINTS.filter((c) => c.status !== "rejected" && (!scopeVendors || scopeVendors.includes(c.vendor ?? ""))).map(slaOf);
}

export function slaSummary(rows: Sla[]) {
  const n = (s: SlaState) => rows.filter((r) => r.state === s).length;
  const breached = n("Overdue") + n("Missed");
  return {
    total: rows.length,
    onTrack: n("On track"),
    atRisk: n("At risk"),
    overdue: n("Overdue"),
    met: n("Met"),
    missed: n("Missed"),
    compliance: rows.length ? Math.round(((rows.length - breached) / rows.length) * 1000) / 10 : null,
  };
}

/** 150 → "2h 30m", 2000 → "1d 9h". */
export function fmtDuration(min: number): string {
  const m = Math.abs(Math.round(min));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${String(mm).padStart(2, "0")}m`;
  return `${mm}m`;
}

export const slaLabel = (r: Sla) => (r.leftMin >= 0 ? `${fmtDuration(r.leftMin)} left` : `${fmtDuration(r.leftMin)} over`);

export const fmtDue = (d: Date) => d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
