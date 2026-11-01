"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, Download, Loader2, Search, ShieldAlert, TriangleAlert, X } from "lucide-react";
import { api, num, pick, rowsOf, text, timeText, type Row } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { downloadExcel } from "@/lib/report-export";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Input, ListSkeleton, NoDataRow, PageHeader, Select, td, th } from "@/components/ui";
import { Pager } from "@/components/pager";

const SOURCES = ["login", "admin", "complaint", "user", "fine"];
const MAX_RANGE_DAYS = 366;

const sourceTone: Record<string, string> = {
  login: "bg-sky-50 text-sky-700 ring-sky-600/15",
  admin: "bg-navy-100 text-navy-800 ring-navy-600/15",
  complaint: "bg-brand-50 text-brand-700 ring-brand-600/15",
  fine: "bg-rose-50 text-rose-700 ring-rose-600/15",
  user: "bg-violet-50 text-violet-700 ring-violet-600/15",
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  client_admin: "Client Admin",
  client: "Complaint Creator",
  project_manager: "Project Manager",
  vendor: "Vendor",
  worker: "Worker",
};

/** Action outcome → badge colour: failures red, successes green, creations brand. */
const actionTone = (a: string) =>
  /FAIL|DENIED|REJECT|DELETE|WAIVE/.test(a)
    ? "bg-rose-50 text-rose-700 ring-rose-600/15"
    : /SUCCESS|APPROVE|RESOLVED|CLOSED/.test(a)
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
      : /CREATE|ADD|ASSIGN/.test(a)
        ? "bg-brand-50 text-brand-700 ring-brand-600/15"
        : "bg-slate-100 text-slate-700 ring-slate-500/15";

/** `details` as an object (it may also arrive as a JSON string); null when there is nothing to show. */
function detailsObject(v: unknown): Row | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "string") {
    try {
      const o = JSON.parse(v);
      return o && typeof o === "object" ? (Array.isArray(o) ? { items: o } : o) : { value: v };
    } catch {
      return { value: v };
    }
  }
  return typeof v === "object" ? (Array.isArray(v) ? { items: v } : (v as Row)) : { value: v };
}

/** Each `details` field as label + value: lists become chips, nested objects stay JSON. */
function DetailsView({ d }: { d: Row }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(d).map(([k, v]) => (
        <div key={k} className={cn(Array.isArray(v) && "sm:col-span-2 lg:col-span-3")}>
          <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{humanize(k)}</dt>
          <dd className="mt-1 text-[13px] text-slate-800">
            {Array.isArray(v) ? (
              v.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {v.map((x, i) => <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{typeof x === "object" ? JSON.stringify(x) : String(x)}</span>)}
                </span>
              ) : "—"
            ) : v === null || v === undefined || v === "" ? (
              <span className="text-slate-400">—</span>
            ) : typeof v === "object" ? (
              <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
            ) : (
              <span className="font-mono">{String(v)}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** `details` flattened to one line for the Excel export. */
function detailsText(v: unknown) {
  const d = detailsObject(v);
  return d ? Object.entries(d).map(([k, x]) => `${k}: ${Array.isArray(x) ? x.join(", ") : x === null ? "—" : typeof x === "object" ? JSON.stringify(x) : String(x)}`).join("; ") : "";
}

const humanize = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** One row of `getAuditLogs.data`. */
const entry = (r: Row) => ({
  time: pick(r, "event_time"),
  actorId: num(pick(r, "actor_id")),
  actor: text(pick(r, "actor_name"), "System"),
  role: text(pick(r, "actor_role"), ""),
  roleLabel: ROLE_LABEL[text(pick(r, "actor_role"), "")] ?? humanize(text(pick(r, "actor_role"), "")),
  source: text(pick(r, "source"), ""),
  action: text(pick(r, "action"), ""),
  entityType: text(pick(r, "entity_type"), ""),
  entityId: text(pick(r, "entity_id"), ""),
  entityLabel: text(pick(r, "entity_label"), ""),
  summary: text(pick(r, "summary"), ""),
  details: pick(r, "details"),
  ip: text(pick(r, "ip_address"), ""),
});

export default function AuditLogsPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState<{ id: number; name: string } | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  // Debounce the search box so each keystroke does not hit the server.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const filters = { search, source, action, actor_id: actor?.id, from_date: from, to_date: to };
  const list = useApi(() => {
    // The server rejects ranges longer than a year; say so before asking it.
    if (from && to && (from > to || (Date.parse(to) - Date.parse(from)) / 86400000 > MAX_RANGE_DAYS)) return Promise.reject(new Error("Pick a date range of at most one year, with From before To."));
    return api.getAuditLogs({ ...filters, page, limit });
  }, [search, source, action, actor?.id, from, to, page, limit]);
  // Besides `data`, the envelope carries the applied date range, events per action (section_2) and failed-login IPs (section_3).
  const env = list.data as unknown as Row | null;
  const rows = rowsOf(list.data?.data).map(entry);
  const byAction = rowsOf(env?.section_2);
  const failedIps = rowsOf(env?.section_3);
  const fromShown = from || text(env?.from_date, "");
  const toShown = to || text(env?.to_date, "");
  const actions = [...new Set([...byAction.map((a) => text(pick(a, "action"), "")), ...rows.map((r) => r.action), action])].filter(Boolean).sort();
  const sources = [...new Set([...SOURCES, ...rows.map((r) => r.source), source])].filter(Boolean);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const exportAll = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await api.getAuditLogs({ ...filters, page: 1, limit, export: true });
      const all = rowsOf(res.data).map(entry);
      await downloadExcel(
        {
          title: "Audit logs",
          summary: [],
          sections: [
            {
              name: "Audit logs",
              columns: ["Event time", "Source", "Action", "Actor ID", "Actor", "Actor role", "Entity type", "Entity ID", "Entity", "Summary", "Details", "IP address"],
              rows: all.map((a) => [timeText(a.time), a.source, a.action, a.actorId === undefined ? "" : String(a.actorId), a.actor, a.role ? a.roleLabel : "", a.entityType, a.entityId, a.entityLabel, a.summary, detailsText(a.details), a.ip]),
            },
          ],
        },
        [`${fromShown || "…"} to ${toShown || "…"}`, source && `Source: ${source}`, action && `Action: ${action}`, actor && `Actor: ${actor.name}`, search && `Search: ${search}`].filter(Boolean).join(" · "),
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Could not export the audit logs.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Audit logs"
        description="Immutable record of every action — who did what, when and from where. Shows the last 30 days unless you pick dates (max one year)."
        actions={
          <Button variant="secondary" onClick={exportAll} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export Excel
          </Button>
        }
      />
      {exportError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">{exportError}</p>}

      {list.data && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Events by action" subtitle="Click one to filter the log" />
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              {byAction.length === 0 && <p className="text-sm text-slate-500">No events in this period.</p>}
              {byAction.map((a) => {
                const name = text(pick(a, "action"), "");
                return (
                  <button
                    key={name}
                    onClick={() => reset(setAction)(action === name ? "" : name)}
                    className={cn("inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition", action === name ? "border-brand-400 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-700 hover:bg-slate-50")}
                  >
                    {humanize(name)}
                    <span className="rounded-md bg-slate-100 px-1.5 text-xs font-bold text-slate-700 tabular-nums">{text(pick(a, "event_count"), "0")}</span>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Failed sign-ins by IP" icon={ShieldAlert} />
            <ul className="divide-y divide-slate-100 px-5 pb-3">
              {failedIps.length === 0 && <li className="py-2 text-sm text-slate-500">No failed sign-ins in this period.</li>}
              {failedIps.map((ip) => (
                <li key={text(pick(ip, "ip_address"))} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-mono text-slate-800">{text(pick(ip, "ip_address"))}</span>
                  <span className="text-xs text-slate-500">last {timeText(pick(ip, "last_attempt"))}</span>
                  <Badge className="bg-rose-50 text-rose-700 ring-rose-600/15">{text(pick(ip, "attempts"), "0")} failed attempts</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, action, entity" className="pl-9" />
          </div>
          <Select value={source} onChange={(e) => reset(setSource)(e.target.value)} className="w-40" aria-label="Source">
            <option value="">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </Select>
          <Select value={action} onChange={(e) => reset(setAction)(e.target.value)} className="w-52" aria-label="Action">
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{humanize(a)}</option>)}
          </Select>
          <Input type="date" value={fromShown} max={toShown || undefined} onChange={(e) => reset(setFrom)(e.target.value)} className="w-40" aria-label="From date" />
          <Input type="date" value={toShown} min={fromShown || undefined} onChange={(e) => reset(setTo)(e.target.value)} className="w-40" aria-label="To date" />
          {actor && (
            <button onClick={() => reset(setActor)(null)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-[13px] font-semibold text-brand-700 hover:bg-brand-100">
              Actor: {actor.name} <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Event time</th>
                <th className={th}>Source</th>
                <th className={th}>Action</th>
                <th className={th}>Actor</th>
                <th className={th}>Entity</th>
                <th className={th}>Summary</th>
                <th className={th}>IP address</th>
                <th className={th}>Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.loading && (
                <tr><td colSpan={8} className="p-4"><ListSkeleton rows={5} className="rounded-none shadow-none ring-0" /></td></tr>
              )}
              {!list.loading && !list.error && rows.length === 0 && <NoDataRow cols={8} />}
              {!list.loading && rows.map((a, i) => {
                const details = detailsObject(a.details);
                return (
                  <Fragment key={i}>
                    <tr className={cn("align-top hover:bg-slate-50/60", /FAIL/.test(a.action) && "bg-rose-50/30")}>
                      <td className={cn(td, "font-mono text-xs text-slate-500")}>{timeText(a.time)}</td>
                      <td className={td}>{a.source ? <Badge className={sourceTone[a.source.toLowerCase()] ?? "bg-slate-100 text-slate-700 ring-slate-500/15"}>{humanize(a.source)}</Badge> : "—"}</td>
                      <td className={td}>
                        {a.action ? <Badge className={actionTone(a.action)}>{humanize(a.action)}</Badge> : "—"}
                        {a.action && <p className="mt-1 font-mono text-[11px] text-slate-400">{a.action}</p>}
                      </td>
                      <td className={td}>
                        <button
                          disabled={!a.actorId}
                          onClick={() => a.actorId && reset(setActor)({ id: a.actorId, name: a.actor })}
                          className="flex items-center gap-2.5 text-left enabled:hover:opacity-80"
                          title={a.actorId ? "Show only this user’s actions" : undefined}
                        >
                          <Avatar name={a.actor} size="xs" />
                          <span>
                            <span className="block text-[13px] font-semibold text-slate-800">{a.actor}</span>
                            <span className="block text-[11px] text-slate-500">
                              {a.role ? a.roleLabel : "Unknown user"}{a.actorId !== undefined && ` · ID ${a.actorId}`}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className={td}>
                        <p className="max-w-[220px] truncate text-[13px] text-slate-800" title={a.entityLabel}>{a.entityLabel || "—"}</p>
                        <p className="font-mono text-[11px] text-slate-500">{a.entityType ? humanize(a.entityType) : "—"}{a.entityId && ` · ID ${a.entityId}`}</p>
                      </td>
                      <td className={cn(td, "max-w-[320px] whitespace-normal text-[13px]")}>{a.summary || "—"}</td>
                      <td className={cn(td, "font-mono text-xs text-slate-500")}>{a.ip || "—"}</td>
                      <td className={td}>
                        {details ? (
                          <Button variant="ghost" size="sm" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                            {Object.keys(details).length} fields <ChevronDown className={cn("transition", open === i && "rotate-180")} />
                          </Button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                    {open === i && details && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={8} className="px-4 py-3">
                          <DetailsView d={details} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.error && <EmptyState icon={TriangleAlert} title="Could not load audit logs" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}
        {list.data && (
          <p className="border-t border-slate-100 px-4 pt-3 text-xs text-slate-500">
            Period <b className="text-slate-700">{text(env?.from_date)}</b> to <b className="text-slate-700">{text(env?.to_date)}</b> · {list.data.pagination?.total ?? rows.length} events
          </p>
        )}
        {list.data && <Pager page={page} limit={limit} total={list.data.pagination?.total} totalPages={list.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />}
      </Card>
    </>
  );
}
