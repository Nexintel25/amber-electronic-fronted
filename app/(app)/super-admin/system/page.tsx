"use client";

import { useState, type ReactNode } from "react";
import {
  Activity,
  AlertOctagon,
  CircleCheck,
  CircleHelp,
  Clock,
  Database,
  Gauge,
  KeyRound,
  Lock,
  LogIn,
  RefreshCw,
  Send,
  ShieldAlert,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react";
import { api, num, pick, rowsOf, text, timeText, type Row } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, PageSkeleton, Progress, Select, StatCard, td, th } from "@/components/ui";
import { Legend, SERIES, TrendArea } from "@/components/charts";

const RANGES = [1, 7, 14, 30, 90];

/* ------------------------------- formatting ------------------------------- */

const n = (v: unknown) => num(v);
const int = (v: unknown) => (n(v) === undefined ? "—" : n(v)!.toLocaleString("en-IN"));
const ms = (v: unknown) => (n(v) === undefined ? "—" : `${Math.round(n(v)!).toLocaleString("en-IN")} ms`);
const pct = (v: unknown) => (n(v) === undefined ? "—" : `${n(v)!.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`);
const mb = (v: unknown) => (n(v) === undefined ? "—" : `${n(v)!.toLocaleString("en-IN", { maximumFractionDigits: 2 })} MB`);
/** Minutes/seconds as "3d 4h", "2h 5m", "12m". */
function duration(minutes: number | undefined) {
  if (minutes === undefined) return "—";
  const m = Math.round(minutes);
  return m >= 1440 ? `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h` : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
const minutes = (v: unknown) => duration(n(v));
const seconds = (v: unknown) => (n(v) === undefined ? "—" : n(v)! < 60 ? `${n(v)}s` : duration(n(v)! / 60));
/** "2026-11-01 15:00" → "15:00", with the date added when the trend spans several days. */
const hourLabel = (h: string, multiDay: boolean) => {
  const [d, t] = h.split(" ");
  if (!multiDay || !d) return t ?? h;
  const date = new Date(`${d}T00:00:00`);
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${t}`;
};

/** Health status → status palette, always shown with an icon and a label. */
const HEALTH: Record<string, { label: string; tone: string; icon: typeof CircleCheck }> = {
  up: { label: "Operational", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", icon: CircleCheck },
  healthy: { label: "Operational", tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", icon: CircleCheck },
  degraded: { label: "Degraded", tone: "bg-amber-50 text-amber-700 ring-amber-600/20", icon: TriangleAlert },
  down: { label: "Down", tone: "bg-rose-50 text-rose-700 ring-rose-600/15", icon: AlertOctagon },
  unknown: { label: "Unknown — no heartbeat yet", tone: "bg-slate-100 text-slate-700 ring-slate-500/15", icon: CircleHelp },
};

/** Label / value rows inside a card. */
function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-slate-100 px-5 pb-3">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
          <dt className="text-slate-500">{k}</dt>
          <dd className="text-right font-semibold break-all text-slate-800 tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function SystemOverviewPage() {
  const [days, setDays] = useState(7);
  const overview = useApi(() => api.getSystemOverview(days, 1), [days]);
  const d = (overview.data ?? null) as Row | null;
  const health = (d?.health ?? {}) as Row;
  const perf = (d?.performance ?? {}) as Row;
  const db = (d?.database ?? {}) as Row;
  const act = (d?.activity ?? {}) as Row;
  const incidents = rowsOf(d?.incidents);
  const tables = rowsOf(d?.top_tables);
  const trend = rowsOf(d?.hourly_trend);

  const status = text(pick(health, "status"), "unknown").toLowerCase();
  const h = HEALTH[status] ?? { ...HEALTH.unknown, label: text(pick(health, "status")) };
  const multiDay = new Set(trend.map((r) => text(r.hour).split(" ")[0])).size > 1;
  const trendData = trend.map((r) => ({
    hour: hourLabel(text(r.hour), multiDay),
    requests: n(r.requests) ?? 0,
    errors_5xx: n(r.errors_5xx) ?? 0,
    avg_response_ms: n(r.avg_response_ms) ?? 0,
  }));
  const traffic = [
    { key: "requests", label: "Requests", color: SERIES[0] },
    { key: "errors_5xx", label: "5xx errors", color: SERIES[1] },
  ];
  const conns = n(db.threads_connected);
  const maxConns = n(db.max_connections);
  const connPct = conns !== undefined && maxConns ? (conns / maxConns) * 100 : undefined;
  const biggest = Math.max(0, ...tables.map((t) => n(t.size_mb) ?? 0));

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="System overview"
        description="Platform health, API performance, database and user activity."
        actions={
          <>
            <Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-40" aria-label="Period">
              {RANGES.map((x) => <option key={x} value={x}>{x === 1 ? "Last 24 hours" : `Last ${x} days`}</option>)}
            </Select>
            <Button variant="secondary" onClick={overview.reload} disabled={overview.loading}>
              <RefreshCw className={overview.loading ? "animate-spin" : undefined} /> Refresh
            </Button>
          </>
        }
      />

      {overview.loading && <PageSkeleton />}
      {overview.error && <EmptyState icon={TriangleAlert} title="Could not load the system overview" text={overview.error} action={<Button onClick={overview.reload}>Try again</Button>} />}

      {d && !overview.loading && (
        <div className="space-y-6">
          {/* Health */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
              <div className="flex items-center gap-3">
                <span className={cn("grid size-10 place-items-center rounded-xl ring-1", h.tone)}>
                  <h.icon className="size-5" />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">Platform health</p>
                  <p className="text-xs text-slate-500">Checked {timeText(pick(health, "checked_at"))} · {int(pick(health, "window_days"))}-day window</p>
                </div>
              </div>
              <Badge className={h.tone}><h.icon className="size-3.5" /> {h.label}</Badge>
            </div>
            <div className="grid gap-x-8 px-0 pt-3 md:grid-cols-2">
              <Facts
                rows={[
                  ["Uptime", pct(pick(health, "uptime_pct"))],
                  ["Current uptime", minutes(pick(health, "current_uptime_minutes"))],
                  ["Downtime", minutes(pick(health, "downtime_minutes"))],
                  ["Longest downtime", minutes(pick(health, "longest_downtime_minutes"))],
                ]}
              />
              <Facts
                rows={[
                  ["Incidents", int(pick(health, "incidents"))],
                  ["Last heartbeat", timeText(pick(health, "last_heartbeat_at"))],
                  ["Since last heartbeat", seconds(pick(health, "seconds_since_last_heartbeat"))],
                  ["Monitoring since", timeText(pick(health, "monitoring_since"))],
                ]}
              />
            </div>
          </Card>

          {/* Performance */}
          <div>
            <p className="mb-3 text-[13px] font-semibold tracking-wide text-slate-500 uppercase">API performance · last {days === 1 ? "24 hours" : `${days} days`}</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Requests" value={int(perf.requests)} icon={Activity} tone="navy" hint={`peak ${int(perf.peak_requests_per_min)}/min`} />
              <StatCard label="Error rate (5xx)" value={pct(perf.error_rate_pct)} icon={ShieldAlert} tone="rose" hint={`${int(perf.errors_5xx)} 5xx · ${int(perf.errors_4xx)} 4xx`} />
              <StatCard label="Avg response" value={ms(perf.avg_response_ms)} icon={Gauge} tone="brand" hint={`max ${ms(perf.max_response_ms)}`} />
              <StatCard label="Last hour" value={int(perf.last_hour_requests)} icon={Clock} tone="sky" hint={`${pct(perf.last_hour_error_rate_pct)} errors · avg ${ms(perf.last_hour_avg_ms)}`} />
            </div>
          </div>

          {/* Hourly trend — two charts, one unit each */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader title="Traffic per hour" subtitle="Requests and server errors" action={<Legend items={traffic} />} />
              <div className="px-3 pb-4">
                <TrendArea data={trendData} xKey="hour" series={traffic} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Response time per hour" subtitle="Average, in milliseconds" />
              <div className="px-3 pb-4">
                <TrendArea data={trendData} xKey="hour" series={[{ key: "avg_response_ms", label: "Avg response (ms)", color: SERIES[0] }]} />
              </div>
            </Card>
          </div>

          {/* Activity */}
          <div>
            <p className="mb-3 text-[13px] font-semibold tracking-wide text-slate-500 uppercase">Activity</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Active users" value={int(act.users_active)} icon={Users} tone="navy" hint={`${int(act.active_sessions)} active sessions`} />
              <StatCard label="Logins today" value={int(act.logins_today)} icon={LogIn} tone="emerald" hint="successful sign-ins" />
              <StatCard label="Complaints" value={int(act.complaints_total)} icon={Zap} tone="brand" hint={`${int(act.complaints_open)} open · ${int(act.complaints_today)} today`} />
              <StatCard label="Push backlog" value={int(act.push_backlog)} icon={Send} tone="amber" hint="notifications waiting to send" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Failed logins (24h)" value={int(act.failed_logins_24h)} icon={KeyRound} tone="rose" />
              <StatCard label="Locked accounts" value={int(act.locked_accounts)} icon={Lock} tone="violet" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Database */}
            <Card>
              <CardHeader title="Database" subtitle={text(db.version)} icon={Database} />
              {connPct !== undefined && (
                <div className="px-5 pb-2">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-500">Connections in use</span>
                    <span className="font-bold text-slate-800 tabular-nums">{int(conns)} / {int(maxConns)}</span>
                  </div>
                  <Progress value={connPct} tone={connPct >= 80 ? "bg-rose-500" : connPct >= 60 ? "bg-amber-500" : "bg-brand-500"} />
                </div>
              )}
              <Facts
                rows={[
                  ["Status", Number(db.status_available) === 1 ? "Available" : "Unavailable"],
                  ["Uptime", seconds(db.uptime_seconds)],
                  ["Threads connected", int(db.threads_connected)],
                  ["Threads running", int(db.threads_running)],
                  ["Max connections", int(db.max_connections)],
                  ["Slow queries", int(db.slow_queries)],
                  ["Aborted connects", int(db.aborted_connects)],
                  ["Database size", mb(db.db_size_mb)],
                ]}
              />
            </Card>

            {/* Top tables */}
            <Card>
              <CardHeader title="Largest tables" subtitle={`${tables.length} tables by size`} />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className={th}>Table</th>
                      <th className={cn(th, "text-right")}>Rows</th>
                      <th className={th}>Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tables.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">No table statistics.</td></tr>}
                    {tables.map((t) => {
                      const size = n(t.size_mb) ?? 0;
                      return (
                        <tr key={text(pick(t, "TABLE_NAME", "table_name"))}>
                          <td className={cn(td, "font-mono text-xs text-slate-800")}>{text(pick(t, "TABLE_NAME", "table_name"))}</td>
                          <td className={cn(td, "text-right tabular-nums")}>{int(t.row_count)}</td>
                          <td className={cn(td, "w-1/2")}>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full" style={{ width: `${biggest ? (size / biggest) * 100 : 0}%`, background: SERIES[0] }} />
                              </div>
                              <span className="w-16 text-right text-xs text-slate-600 tabular-nums">{mb(size)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Incidents */}
          <Card>
            <CardHeader title="Incidents" subtitle={`In the last ${days === 1 ? "24 hours" : `${days} days`}`} icon={AlertOctagon} />
            {incidents.length === 0 ? (
              <p className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
                <CircleCheck className="size-4" /> No incidents in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/70">
                    <tr>{Object.keys(incidents[0]).map((k) => <th key={k} className={th}>{k.replace(/_/g, " ")}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {incidents.map((r, i) => (
                      <tr key={i}>
                        {Object.keys(incidents[0]).map((k) => (
                          <td key={k} className={td}>{/(_at|time|date)$/.test(k) ? timeText(r[k]) : text(r[k])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
