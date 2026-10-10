import { COMPLAINTS, PHOTO_SETS, VENDORS, WORKERS, inr, penaltyOf, pmOfVendor, type Complaint } from "./data";
import { PENALTY_AFTER_DAYS, STATUS_META } from "./workflow";

export type ReportKey = "complaints" | "daily" | "vendor" | "worker" | "photo" | "penalty";

export type ReportFilters = {
  type: ReportKey;
  /** ISO yyyy-mm-dd, inclusive. Empty = no bound. */
  from: string;
  to: string;
  /** Vendor name, empty = all vendors. */
  vendor: string;
  q: string;
};

export type ReportResult = { title: string; columns: string[]; rows: string[][]; summary: { label: string; value: string }[] };

export const REPORT_TYPES: { key: ReportKey; label: string; hint: string }[] = [
  { key: "complaints", label: "Complaint report", hint: "Every complaint with status, vendor and age" },
  { key: "daily", label: "Daily report", hint: "Complaints raised, closed and open per day" },
  { key: "vendor", label: "Vendor performance report", hint: "Volume, rework, turnaround and SLA per vendor" },
  { key: "worker", label: "Worker productivity report", hint: "Jobs, speed and photo compliance per worker" },
  { key: "photo", label: "Photo report", hint: "Before/after photo sets with GPS check" },
  { key: "penalty", label: "Penalty report", hint: "Vendors past the 15-day window" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "24 Sep 2026, 09:12 AM" or "24 Sep, 09:42 → 11:05" → yyyy-mm-dd (year defaults to 2026). */
export function isoDay(text: string): string {
  const m = text.match(/(\d{1,2}) ([A-Za-z]{3})(?: (\d{4}))?/);
  if (!m) return "";
  const mon = MONTHS.indexOf(m[2]) + 1;
  return `${m[3] ?? "2026"}-${String(mon).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

const inRange = (iso: string, f: ReportFilters) => !!iso && (!f.from || iso >= f.from) && (!f.to || iso <= f.to);
const matches = (cells: string[], q: string) => !q || cells.join(" ").toLowerCase().includes(q.toLowerCase());

/** `scope` limits a report to some vendors (a PM sees only their vendors, a vendor only themselves). */
function complaintsIn(f: ReportFilters, scope?: string[]): Complaint[] {
  return COMPLAINTS.filter((c) => allowed(f, scope, c.vendor) && inRange(isoDay(c.raisedAt), f));
}

const allowed = (f: ReportFilters, scope: string[] | undefined, vendor?: string) => (!f.vendor || vendor === f.vendor) && (!scope || scope.includes(vendor ?? ""));


export function buildReport(f: ReportFilters, scope?: string[]): ReportResult {
  const def = REPORT_TYPES.find((r) => r.key === f.type)!;
  const done = (columns: string[], rows: string[][], summary: ReportResult["summary"]): ReportResult => {
    const filtered = rows.filter((r) => matches(r, f.q));
    return { title: def.label, columns, rows: filtered, summary: [{ label: "Records", value: String(filtered.length) }, ...summary] };
  };

  if (f.type === "complaints") {
    const list = complaintsIn(f, scope);
    const rows = list.map((c) => [c.id, c.title, c.site, c.vendor ?? "—", c.priority, STATUS_META[c.status].label, c.raisedAt.split(",")[0], String(c.status === "closed" ? (c.closedAfterDays ?? c.daysOpen) : c.daysOpen)]);
    return done(["Complaint", "Title", "Site", "Vendor", "Priority", "Status", "Raised", "Days"], rows, [
      { label: "Open", value: String(list.filter((c) => !["closed", "rejected"].includes(c.status)).length) },
      { label: "Closed", value: String(list.filter((c) => c.status === "closed").length) },
    ]);
  }

  if (f.type === "daily") {
    const byDay = new Map<string, Complaint[]>();
    for (const c of complaintsIn(f, scope)) byDay.set(isoDay(c.raisedAt), [...(byDay.get(isoDay(c.raisedAt)) ?? []), c]);
    const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    const rows = days.map(([d, cs]) => [
      d.split("-").reverse().join("-"),
      String(cs.length),
      String(cs.filter((c) => c.status === "closed").length),
      String(cs.filter((c) => !["closed", "rejected"].includes(c.status)).length),
      String(cs.filter((c) => c.status === "rejected").length),
      String(cs.filter((c) => c.priority === "Critical").length),
    ]);
    return done(["Date", "Raised", "Closed", "Still open", "Rejected", "Critical"], rows, []);
  }

  if (f.type === "vendor") {
    const list = complaintsIn(f, scope);
    const rows = VENDORS.filter((v) => allowed(f, scope, v.name)).map((v) => {
      const cs = list.filter((c) => c.vendor === v.name);
      return [v.name, v.contact, pmOfVendor(v.name) ?? "—", String(cs.length), String(cs.filter((c) => c.status === "closed").length), String(cs.filter((c) => c.status === "rework" || c.status === "issue_raised").length), `${v.avgTat} h`, `${v.sla}%`, `${v.rework}%`, String(v.rating)];
    });
    return done(["Vendor", "Contact", "Project Manager", "Complaints", "Closed", "Rework / issue", "Avg turnaround", "SLA", "Rework rate", "Rating"], rows, []);
  }

  if (f.type === "worker") {
    const list = complaintsIn(f, scope);
    const rows = WORKERS.filter((w) => allowed(f, scope, w.vendor)).map((w) => {
      const cs = list.filter((c) => c.workers?.includes(w.name));
      return [w.name, w.vendor, w.skill, `${w.team} · ${w.site}`, String(cs.length), String(cs.filter((c) => c.status === "closed").length), w.avgTime, `${w.ftf}%`, `${w.photoCompliance}%`, String(w.rating)];
    });
    return done(["Worker", "Vendor", "Skill", "Team · site", "Jobs", "Closed", "Avg time", "First-time fix", "Photo compliance", "Rating"], rows, []);
  }

  if (f.type === "photo") {
    const rows = PHOTO_SETS.filter((p) => {
      const w = WORKERS.find((x) => x.name === p.worker);
      return allowed(f, scope, w?.vendor) && inRange(isoDay(p.time), f);
    }).map((p) => [p.id, p.complaint, p.worker, WORKERS.find((x) => x.name === p.worker)?.vendor ?? "—", p.site, `${p.before} / ${p.after}`, p.gps, p.inFence ? "Inside" : "Outside", p.time, p.status]);
    return done(["Photo set", "Complaint", "Worker", "Vendor", "Site", "Before / after", "GPS distance", "Geo-fence", "Time", "Status"], rows, [
      { label: "Flagged", value: String(rows.filter((r) => r[9] === "Flagged").length) },
    ]);
  }

  // penalty
  const pens = complaintsIn(f, scope).filter((c) => c.vendor).map(penaltyOf).filter((p) => p.state !== "Clear");
  const rows = pens.map((p) => [p.complaint.id, p.complaint.title, p.complaint.vendor ?? "—", p.pm ?? "—", p.complaint.raisedAt.split(",")[0], `${p.days}/${PENALTY_AFTER_DAYS}`, String(p.overdueDays), inr(p.amount), p.state]);
  return done(["Complaint", "Title", "Vendor", "Project Manager", "Raised", "Days / window", "Days late", "Penalty", "State"], rows, [
    { label: "Total penalty", value: inr(pens.reduce((a, p) => a + p.amount, 0)) },
  ]);
}

