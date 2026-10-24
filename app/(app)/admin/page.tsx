import Link from "next/link";
import { BadgeCheck, CircleDashed, ClipboardList, Download, HardHat, Timer, Target } from "lucide-react";
import { CATEGORY_SPLIT, PIPELINE_COUNTS, SITES, TREND_14D, USER_CAP_PER_SITE, WORKERS } from "@/lib/data";
import { STATUS_META } from "@/lib/workflow";
import { WORKER_STATUS } from "@/lib/worker-status";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, LinkButton, LiveDot, PageHeader, Progress, StatCard, td, th } from "@/components/ui";
import { Donut, Legend, SERIES, TrendArea } from "@/components/charts";
import { LiveMap, MapLegend } from "@/components/live-map";
import { LiveFeed } from "@/components/live-feed";

export default function AdminOverview() {
  const open = PIPELINE_COUNTS.filter((p) => p.key !== "closed").reduce((a, p) => a + p.count, 0);
  const catTotal = CATEGORY_SPLIT.reduce((a, c) => a + c.value, 0);

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
        <StatCard label="Total complaints" value="1,284" icon={ClipboardList} tone="navy" delta="12%" hint="vs last month" />
        <StatCard label="Open now" value={open} icon={CircleDashed} tone="sky" hint="at Amber" />
        <StatCard label="Resolved today" value={22} icon={BadgeCheck} tone="emerald" delta="8%" />
        <StatCard label="Avg resolution" value="18.4h" icon={Timer} tone="violet" delta="2.1h" hint="faster" />
        <StatCard label="SLA compliance" value="92.6%" icon={Target} tone="brand" delta="1.4%" />
        <StatCard label="Workers in field" value={WORKERS.filter((w) => w.status !== "Offline").length} icon={HardHat} tone="amber" hint={`${WORKERS.length} total`} />
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
          {PIPELINE_COUNTS.map((p, i) => {
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
            subtitle="Workers and open complaints at Amber"
            action={<LinkButton href="/admin/live" size="sm" variant="secondary">Full screen</LinkButton>}
          />
          <div className="px-5 pb-5">
            <LiveMap
              className="h-80"
              points={[
                ...WORKERS.map((w) => ({ id: w.id, x: w.x, y: w.y, kind: "worker" as const, tone: WORKER_STATUS[w.status].tone, label: w.name, sub: `${w.status} · ${w.site}`, live: w.status !== "Offline" })),
                ...SITES.map((s, i) => ({ id: s.id, x: 15 + i * 18, y: 12 + (i % 2) * 70, kind: "site" as const, tone: "violet" as const, label: s.name, sub: `${s.open} open · ${s.workers} workers` })),
              ]}
            />
            <div className="mt-3">
              <MapLegend items={[{ label: "On task", tone: "amber" }, { label: "Travelling", tone: "blue" }, { label: "Available", tone: "green" }, { label: "Offline", tone: "slate" }, { label: "Site", tone: "violet" }]} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Live activity" subtitle="Real-time events from the field" action={<LiveDot />} />
          <div className="px-3 pb-4">
            <LiveFeed />
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
              data={TREND_14D}
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
            <Donut data={CATEGORY_SPLIT} centerValue={catTotal.toLocaleString("en-IN")} centerLabel="complaints" height={190} />
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {CATEGORY_SPLIT.map((c, i) => (
                <li key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: SERIES[i] }} />
                  <span className="truncate text-slate-600">{c.name}</span>
                  <span className="ml-auto font-semibold text-slate-800 tabular-nums">{Math.round((c.value / catTotal) * 100)}%</span>
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
              {SITES.map((s, i) => {
                const sla = [94.2, 90.8, 92.5, 88.1, 96.4][i];
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className={td}>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.region}</p>
                    </td>
                    <td className={td}>{s.open}</td>
                    <td className={td}>{s.workers}</td>
                    <td className={td}>{s.pms}</td>
                    <td className={td}>
                      <span className={cn("font-semibold", sla < 90 ? "text-rose-600" : "text-emerald-600")}>{sla}%</span>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Progress value={(s.users / USER_CAP_PER_SITE) * 100} tone={s.users >= USER_CAP_PER_SITE ? "bg-rose-500" : "bg-brand-500"} />
                        <span className="text-xs font-semibold text-slate-600 tabular-nums">{s.users}/{USER_CAP_PER_SITE}</span>
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
