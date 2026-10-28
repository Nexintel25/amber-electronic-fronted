"use client";

import Link from "next/link";
import { BadgeCheck, CircleDashed, ClipboardList, Download, HardHat, Loader2, Timer, Target, TriangleAlert } from "lucide-react";
import { api, statusFromApi, timeAgo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { STATUS_META } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, LinkButton, LiveDot, PageHeader, Progress, StatCard, td, th } from "@/components/ui";
import { Donut, Legend, SERIES, TrendArea } from "@/components/charts";
import { LiveMap, MapLegend } from "@/components/live-map";

const pct = (n: number | null) => (n == null ? undefined : `${Math.abs(n)}%`);

export default function AdminOverview() {
  const { data: d, error, loading, reload } = useApi(() => api.getAdminDashboard());

  if (loading) return <div className="grid place-items-center py-32 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>;
  if (error || !d) return <EmptyState icon={TriangleAlert} title="Could not load the dashboard" text={error ?? "No data"} action={<Button onClick={reload}>Try again</Button>} />;

  const k = d.kpis;
  const pipeline = d.pipeline.map((p) => ({ key: statusFromApi(p.status), count: p.total }));
  const catTotal = d.categories.reduce((a, c) => a + c.total, 0);
  const cats = d.categories.filter((c) => c.total > 0).map((c) => ({ name: c.category_name, value: c.total }));
  const trend = d.trend.map((t) => ({ ...t, day: t.day.slice(5) }));

  // The map is a stylised canvas, so project real coordinates onto it relative to the spread of the complaints.
  const geo = d.map_complaints.filter((m) => m.latitude && m.longitude);
  const lats = geo.map((m) => Number(m.latitude));
  const lngs = geo.map((m) => Number(m.longitude));
  const norm = (v: number, arr: number[]) => (Math.max(...arr) === Math.min(...arr) ? 50 : 12 + ((v - Math.min(...arr)) / (Math.max(...arr) - Math.min(...arr))) * 76);

  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Operations overview"
        description="Live status of every complaint, field team and site — with analytics and reports."
        actions={
          <>
            <span className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <LiveDot /> Live
            </span>
            <Button variant="secondary">
              <Download /> Export
            </Button>
            <LinkButton href="/admin/reports">View reports</LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total complaints" value={k.total_complaints.toLocaleString("en-IN")} icon={ClipboardList} tone="navy" delta={pct(k.total_growth_pct)} hint="vs last month" />
        <StatCard label="Open now" value={k.open_now} icon={CircleDashed} tone="sky" hint={`across ${k.open_in_sites} open`} />
        <StatCard label="Resolved today" value={k.resolved_today} icon={BadgeCheck} tone="emerald" delta={pct(k.resolved_change_pct)} />
        <StatCard label="Avg resolution" value={k.avg_resolution_hours == null ? "—" : `${k.avg_resolution_hours}h`} icon={Timer} tone="violet" delta={k.faster_by_hours == null ? undefined : `${Math.abs(k.faster_by_hours)}h`} hint={k.faster_by_hours == null ? undefined : "faster"} />
        <StatCard label="SLA compliance" value={k.sla_compliance_pct == null ? "—" : `${k.sla_compliance_pct}%`} icon={Target} tone="brand" delta={pct(k.sla_change_pct)} />
        <StatCard label="Workers in field" value={k.workers_in_field} icon={HardHat} tone="amber" hint={`${k.workers_total} total`} />
      </div>

      {/* Live status pipeline */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[15px] font-semibold text-slate-900">Live status pipeline</p>
            <p className="text-[13px] text-slate-500">Open complaints by workflow stage</p>
          </div>
          <Link href="/admin/board" className="text-[13px] font-semibold text-brand-600">Open status board →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {pipeline.map((p, i) => {
            const m = STATUS_META[p.key];
            return (
              <Link key={p.key} href="/admin/board" className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-slate-200 hover:bg-white hover:shadow-soft">
                <div className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{i + 1}</span>
                  <span className={cn("size-2 rounded-full", m.dot)} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{p.count.toLocaleString("en-IN")}</p>
                <p className="text-[11.5px] leading-tight font-medium text-slate-500">{m.label}</p>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Live tracking"
            subtitle="Open complaints with a GPS pin"
          />
          <div className="px-5 pb-5">
            <LiveMap
              className="h-80"
              points={[
                ...geo.map((m) => ({ id: `c${m.complaint_id}`, x: norm(Number(m.longitude), lngs), y: 100 - norm(Number(m.latitude), lats), kind: "complaint" as const, tone: "violet" as const, label: m.complaint_no, sub: `${m.title} · ${m.building_name}` })),
              ]}
            />
            <div className="mt-3">
              <MapLegend items={[{ label: "Complaint", tone: "violet" }]} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Live activity" subtitle="Real-time events from the field" action={<LiveDot />} />
          <div className="px-3 pb-4">
            <ul className="space-y-1">
              {d.activity.length === 0 && <li className="px-2 py-6 text-center text-sm text-slate-400">No activity yet.</li>}
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
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Complaints raised vs resolved"
            subtitle="Last 14 days"
            action={<Legend items={[{ label: "Raised", color: SERIES[1] }, { label: "Resolved", color: SERIES[0] }]} />}
          />
          <div className="px-3 pb-4">
            <TrendArea
              data={trend}
              xKey="day"
              series={[
                { key: "raised", label: "Raised", color: SERIES[1] },
                { key: "resolved", label: "Resolved", color: SERIES[0] },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="By category" subtitle="All-time share" />
          <div className="px-5 pb-5">
            <Donut data={cats} centerValue={catTotal.toLocaleString("en-IN")} centerLabel="complaints" height={190} />
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {cats.map((c, i) => (
                <li key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: SERIES[i] }} />
                  <span className="truncate text-slate-600">{c.name}</span>
                  <span className="ml-auto font-semibold text-slate-800 tabular-nums">{catTotal ? Math.round((c.value / catTotal) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Site-wise status" subtitle="Open complaints, field strength and concurrent users (cap 20 per site)" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Site</th>
                <th className={th}>Open</th>
                <th className={th}>Workers</th>
                <th className={th}>PMs</th>
                <th className={th}>SLA</th>
                <th className={cn(th, "w-64")}>Concurrent users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.sites.map((s) => {
                const sla = s.sla_compliance_pct;
                return (
                  <tr key={s.building_id} className="hover:bg-slate-50/60">
                    <td className={td}>
                      <p className="font-semibold text-slate-900">{s.building_name}</p>
                      <p className="text-xs text-slate-500">{s.location}</p>
                    </td>
                    <td className={td}>{s.open_complaints}</td>
                    <td className={td}>{s.workers}</td>
                    <td className={td}>{s.project_managers}</td>
                    <td className={td}>
                      {sla == null ? <span className="text-slate-400">—</span> : <span className={cn("font-semibold", sla < 90 ? "text-rose-600" : "text-emerald-600")}>{sla}%</span>}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Progress value={(s.concurrent_users / s.max_concurrent_users) * 100} tone={s.concurrent_users >= s.max_concurrent_users ? "bg-rose-500" : "bg-brand-500"} />
                        <span className="text-xs font-semibold text-slate-600 tabular-nums">{s.concurrent_users}/{s.max_concurrent_users}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
