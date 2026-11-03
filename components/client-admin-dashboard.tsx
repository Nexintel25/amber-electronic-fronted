"use client";

import Link from "next/link";
import { BadgeCheck, Building2, CircleDashed, ClipboardList, HardHat, Phone, Target, Timer, TriangleAlert } from "lucide-react";
import { api, pick, statusFromApi, text, timeAgo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { STATUS_META } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, NoData, PageHeader, PageSkeleton, StatCard, StatusBadge, td, th } from "@/components/ui";
import { Donut, Legend, SERIES, TrendArea } from "@/components/charts";

const pct = (n: number | null) => (n == null ? undefined : `${Math.abs(n)}%`);
const MAP_STATUS: Record<string, string> = { offline: "bg-slate-100 text-slate-600", online: "bg-emerald-50 text-emerald-700", on_task: "bg-amber-50 text-amber-700", travelling: "bg-sky-50 text-sky-700" };

/** Dashboard for the `client_admin` role (complaint-types/getClientAdminDashboard). */
export function ClientAdminDashboard() {
  const { data: d, error, loading, reload } = useApi(() => api.getClientAdminDashboard());

  if (loading) return <PageSkeleton />;
  if (error || !d) return <EmptyState icon={TriangleAlert} title="Could not load the dashboard" text={error ?? "No data"} action={<Button onClick={reload}>Try again</Button>} />;

  const k = d.kpis;
  const trend = d.daily_trend.map((t) => ({ ...t, day: t.day.slice(5) }));
  const cats = d.by_category.filter((c) => c.total > 0).map((c) => ({ name: c.category_name, value: c.total }));
  const catTotal = cats.reduce((a, c) => a + c.value, 0);

  return (
    <>
      <PageHeader eyebrow="Client Admin" title="Overview" description="Complaints, field team and sites you are responsible for." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total complaints" value={k.total_complaints.toLocaleString("en-IN")} icon={ClipboardList} tone="navy" delta={pct(k.total_growth_pct)} hint="vs last month" />
        <StatCard label="Open now" value={k.open_now} icon={CircleDashed} tone="sky" hint={`across ${k.my_sites} ${k.my_sites === 1 ? "site" : "sites"}`} />
        <StatCard label="Resolved today" value={k.resolved_today} icon={BadgeCheck} tone="emerald" delta={pct(k.resolved_change_pct)} />
        <StatCard label="Avg resolution" value={k.avg_resolution_hours == null ? "—" : `${k.avg_resolution_hours}h`} icon={Timer} tone="violet" delta={k.faster_by_hours == null ? undefined : `${Math.abs(k.faster_by_hours)}h`} hint={k.faster_by_hours == null ? undefined : "faster"} />
        <StatCard label="SLA compliance" value={k.sla_compliance_pct == null ? "—" : `${k.sla_compliance_pct}%`} icon={Target} tone="brand" delta={pct(k.sla_change_pct)} />
        <StatCard label="Workers in field" value={k.workers_in_field} icon={HardHat} tone="amber" hint={`${k.workers_total} total · ${k.workers_online} online`} />
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-4">
          <p className="text-[15px] font-semibold text-slate-900">Status pipeline</p>
          <p className="text-[13px] text-slate-500">Complaints by workflow stage</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {d.pipeline.map((p, i) => {
            const m = STATUS_META[statusFromApi(p.status)];
            return (
              <div key={p.status} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{i + 1}</span>
                  <span className={cn("size-2 rounded-full", m.dot)} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{p.total.toLocaleString("en-IN")}</p>
                <p className="text-[11.5px] leading-tight font-medium text-slate-500">{m.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Complaints raised vs resolved"
            subtitle="Last 14 days"
            action={<Legend items={[{ label: "Raised", color: SERIES[1] }, { label: "Resolved", color: SERIES[0] }]} />}
          />
          <div className="px-3 pb-4">
            <TrendArea data={trend} xKey="day" series={[{ key: "raised", label: "Raised", color: SERIES[1] }, { key: "resolved", label: "Resolved", color: SERIES[0] }]} />
          </div>
        </Card>

        <Card>
          <CardHeader title="By category" subtitle="All-time share" />
          <div className="px-5 pb-5">
            {cats.length === 0 ? (
              <NoData />
            ) : (
              <>
                <Donut data={cats} centerValue={catTotal.toLocaleString("en-IN")} centerLabel="complaints" height={190} />
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {cats.map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="size-2.5 shrink-0 rounded-sm" style={{ background: SERIES[i] }} />
                      <span className="truncate text-slate-600">{c.name}</span>
                      <span className="ml-auto font-semibold text-slate-800 tabular-nums">{Math.round((c.value / catTotal) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Open complaints" subtitle="Awaiting action across your sites" />
          {d.open_complaints.length === 0 ? (
            <NoData />
          ) : (
            <ul className="divide-y divide-slate-100 px-2 pb-3">
              {d.open_complaints.map((c, i) => (
                <li key={i}>
                  <Link href={`/complaints/${text(pick(c, "complaint_id", "id"), "")}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px] font-semibold text-brand-700">{text(pick(c, "complaint_no"))}</span>
                      <span className="block truncate text-[13px] font-medium text-slate-800">{text(pick(c, "title"))}</span>
                      <span className="block truncate text-xs text-slate-500">{text(pick(c, "building_name", "site_name"), "")}</span>
                    </span>
                    {pick(c, "status") !== undefined && <StatusBadge status={statusFromApi(text(pick(c, "status"), ""))} />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent activity" subtitle="Events from the field" />
          <div className="px-3 pb-4">
            {d.activity.length === 0 ? (
              <NoData />
            ) : (
              <ul className="space-y-1">
                {d.activity.map((e, i) => (
                  <li key={i}>
                    <Link href={`/complaints/${e.complaint_id}`} className="flex items-start justify-between gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-slate-800">{e.title}</span>
                        <span className="block truncate text-xs text-slate-500">{e.description}</span>
                      </span>
                      <span className="text-[11px] whitespace-nowrap text-slate-400">{timeAgo(e.event_time)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="My sites" subtitle="Open complaints and field strength per site" icon={Building2} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Site</th>
                <th className={th}>Open</th>
                <th className={th}>Workers</th>
                <th className={th}>PMs</th>
                <th className={th}>SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.sites.map((s) => (
                <tr key={s.building_id} className="hover:bg-slate-50/60">
                  <td className={td}>
                    <p className="font-semibold text-slate-900">{s.building_name}</p>
                    <p className="text-xs text-slate-500">{s.location}</p>
                  </td>
                  <td className={td}>{s.open_complaints}</td>
                  <td className={td}>{s.workers}</td>
                  <td className={td}>{s.project_managers}</td>
                  <td className={td}>
                    {s.sla_compliance_pct == null ? <span className="text-slate-400">—</span> : <span className={cn("font-semibold", s.sla_compliance_pct < 90 ? "text-rose-600" : "text-emerald-600")}>{s.sla_compliance_pct}%</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Field workers" subtitle={`${d.workers.length} workers across your sites`} icon={HardHat} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Worker</th>
                <th className={th}>Phone</th>
                <th className={th}>Status</th>
                <th className={th}>Current complaint</th>
                <th className={th}>Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.workers.map((w) => (
                <tr key={w.worker_id} className="hover:bg-slate-50/60">
                  <td className={cn(td, "font-semibold text-slate-900")}>{w.name}</td>
                  <td className={td}>
                    {w.phone ? <a href={`tel:${w.phone}`} className="inline-flex items-center gap-1.5 text-brand-700"><Phone className="size-3.5" />{w.phone}</a> : "—"}
                  </td>
                  <td className={td}>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", MAP_STATUS[w.map_status] ?? "bg-slate-100 text-slate-600")}>{w.map_status.replace(/_/g, " ")}</span>
                  </td>
                  <td className={td}>{w.current_complaint_no ?? "—"}</td>
                  <td className={td}>{w.last_seen ? timeAgo(w.last_seen) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
