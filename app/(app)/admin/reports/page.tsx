"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock, FileSpreadsheet, FileText, Mail, Star, TriangleAlert } from "lucide-react";
import { HOURLY_TODAY, PHOTO_SETS, SITES, VENDORS, WORKERS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, PageHeader, Progress, Select, td, th } from "@/components/ui";
import { Tabs } from "@/components/interactive";
import { Bars, Legend, SERIES } from "@/components/charts";
import { GeoPhoto } from "@/components/geo-photo";

type Report = "daily" | "vendor" | "worker" | "photo";

export default function ReportsPage() {
  const [tab, setTab] = useState<Report>("daily");

  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Reports"
        description="Daily, vendor performance, worker productivity and photo reports — export or schedule by email."
        actions={
          <>
            <Button variant="secondary">
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="secondary">
              <FileText /> PDF
            </Button>
            <Button>
              <Mail /> Schedule
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "daily", label: "Daily report" },
            { value: "vendor", label: "Vendor performance" },
            { value: "worker", label: "Worker productivity" },
            { value: "photo", label: "Photo reports" },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm">
            <CalendarDays /> {tab === "daily" ? "24 Sep 2026" : "1 Sep – 24 Sep 2026"}
          </Button>
          <Select className="h-8 w-44 text-[13px]">
            <option>All sites</option>
            {SITES.map((s) => (
              <option key={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {tab === "daily" && <DailyReport />}
      {tab === "vendor" && <VendorReport />}
      {tab === "worker" && <WorkerReport />}
      {tab === "photo" && <PhotoReport />}

      <Card className="mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-700">
          <Mail className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Scheduled delivery</p>
          <p className="text-xs text-slate-500">Daily report emailed at 8:00 AM to 6 recipients · Weekly vendor report every Monday</p>
        </div>
        <Button variant="secondary" size="sm">Manage schedules</Button>
      </Card>
    </>
  );
}

function Summary({ items }: { items: { l: string; v: string; s?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {items.map((i) => (
        <Card key={i.l} className="p-4">
          <p className="text-xs font-medium text-slate-500">{i.l}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{i.v}</p>
          {i.s && <p className="text-[11px] text-slate-500">{i.s}</p>}
        </Card>
      ))}
    </div>
  );
}

function DailyReport() {
  return (
    <div className="space-y-6">
      <Summary
        items={[
          { l: "Raised today", v: "36", s: "+4 vs yesterday" },
          { l: "Closed today", v: "22" },
          { l: "Open at EOD", v: "60" },
          { l: "SLA breached", v: "2", s: "CMP-0137, CMP-0133" },
          { l: "Field hours", v: "71.5h", s: "10 workers" },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Hourly activity" subtitle="Complaints raised vs closed" action={<Legend items={[{ label: "Raised", color: SERIES[1] }, { label: "Closed", color: SERIES[0] }]} />} />
          <div className="px-3 pb-4">
            <Bars data={HOURLY_TODAY} xKey="hour" series={[{ key: "raised", label: "Raised", color: SERIES[1] }, { key: "closed", label: "Closed", color: SERIES[0] }]} height={260} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Site summary" />
          <ul className="divide-y divide-slate-100">
            {SITES.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500">{[12, 8, 7, 5, 4][i]} raised · {[9, 5, 4, 2, 2][i]} closed</p>
                </div>
                <span className="text-sm font-bold text-slate-900 tabular-nums">{s.open}</span>
                <span className="text-xs text-slate-400">open</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function VendorReport() {
  return (
    <div className="space-y-6">
      <Summary
        items={[
          { l: "Vendors", v: String(VENDORS.length) },
          { l: "Assigned", v: String(VENDORS.reduce((a, v) => a + v.assigned, 0)) },
          { l: "Closed", v: String(VENDORS.reduce((a, v) => a + v.closed, 0)) },
          { l: "Avg TAT", v: "20.4h" },
          { l: "Avg SLA", v: "89.8%" },
        ]}
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Vendor</th>
                <th className={th}>Assigned</th>
                <th className={th}>Closed</th>
                <th className={th}>Avg turnaround</th>
                <th className={cn(th, "w-56")}>SLA compliance</th>
                <th className={th}>Rework rate</th>
                <th className={th}>Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VENDORS.map((v, i) => (
                <tr key={v.id} className="hover:bg-slate-50/60">
                  <td className={td}>
                    <span className={cn("grid size-7 place-items-center rounded-lg text-xs font-bold", i === 0 ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500")}>{i + 1}</span>
                  </td>
                  <td className={td}>
                    <p className="font-semibold text-slate-900">{v.name}</p>
                    <p className="text-xs text-slate-500">{v.contact}</p>
                  </td>
                  <td className={td}>{v.assigned}</td>
                  <td className={td}>{v.closed}</td>
                  <td className={td}>{v.avgTat} h</td>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Progress value={v.sla} tone={v.sla < 90 ? "bg-rose-500" : "bg-emerald-500"} />
                      <span className="w-12 text-right text-xs font-bold tabular-nums">{v.sla}%</span>
                    </div>
                  </td>
                  <td className={td}>
                    <span className={cn("font-semibold", v.rework > 7 ? "text-rose-600" : "text-slate-700")}>{v.rework}%</span>
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-1 font-semibold"><Star className="size-3.5 fill-brand-400 text-brand-400" />{v.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardHeader title="Assigned vs closed by vendor" action={<Legend items={[{ label: "Assigned", color: SERIES[0] }, { label: "Closed", color: SERIES[1] }]} />} />
        <div className="px-3 pb-4">
          <Bars data={VENDORS.map((v) => ({ name: v.name.split(" ")[0], assigned: v.assigned, closed: v.closed }))} xKey="name" series={[{ key: "assigned", label: "Assigned", color: SERIES[0] }, { key: "closed", label: "Closed", color: SERIES[1] }]} height={260} />
        </div>
      </Card>
    </div>
  );
}

function WorkerReport() {
  const sorted = [...WORKERS].sort((a, b) => b.completed - a.completed);
  return (
    <div className="space-y-6">
      <Summary
        items={[
          { l: "Active workers", v: String(WORKERS.length) },
          { l: "Tasks completed", v: String(WORKERS.reduce((a, w) => a + w.completed, 0)), s: "today" },
          { l: "Avg time / task", v: "1h 42m" },
          { l: "First-time fix", v: "91.7%" },
          { l: "Photo compliance", v: "97.5%" },
        ]}
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Worker</th>
                <th className={th}>Team / site</th>
                <th className={th}>Assigned</th>
                <th className={th}>Completed</th>
                <th className={th}>Avg time</th>
                <th className={th}>First-time fix</th>
                <th className={cn(th, "w-48")}>Photo compliance</th>
                <th className={th}>Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={w.name} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900">{w.name}</p>
                        <p className="text-xs text-slate-500">{w.skill}</p>
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <p>{w.team}</p>
                    <p className="text-xs text-slate-500">{w.site}</p>
                  </td>
                  <td className={td}>{w.tasksToday}</td>
                  <td className={td}><b>{w.completed}</b></td>
                  <td className={td}>{w.avgTime}</td>
                  <td className={td}>{w.ftf}%</td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <Progress value={w.photoCompliance} tone={w.photoCompliance < 95 ? "bg-amber-500" : "bg-emerald-500"} />
                      <span className="text-xs font-semibold tabular-nums">{w.photoCompliance}%</span>
                    </div>
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-1"><Star className="size-3.5 fill-brand-400 text-brand-400" />{w.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PhotoReport() {
  return (
    <div className="space-y-6">
      <Summary
        items={[
          { l: "Photo sets", v: "1,146" },
          { l: "Photos captured", v: "4,812" },
          { l: "Geo-verified", v: "98.9%" },
          { l: "Flagged", v: "13", s: "GPS outside fence" },
          { l: "S3 storage used", v: "38.2 GB" },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PHOTO_SETS.map((p, i) => (
          <Card key={p.id} className="overflow-hidden">
            <div className="grid grid-cols-2 gap-1 p-1">
              <GeoPhoto kind="before" seed={i} compact className="rounded-lg rounded-tl-xl" />
              {p.after > 0 ? (
                <GeoPhoto kind="after" seed={i} compact className="rounded-lg rounded-tr-xl" />
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-lg rounded-tr-xl bg-slate-100 text-xs text-slate-400">Pending</div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-brand-700">{p.complaint}</span>
                <Badge
                  className={
                    p.status === "Verified"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                      : p.status === "Flagged"
                        ? "bg-rose-50 text-rose-700 ring-rose-600/15"
                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                  }
                >
                  {p.status}
                </Badge>
              </div>
              <p className="mt-1 text-[13px] font-semibold text-slate-800">{p.worker} · {p.site}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                <span>{p.before} before / {p.after} after</span>
                <span className={cn("flex items-center gap-1", p.inFence ? "text-emerald-600" : "font-semibold text-rose-600")}>
                  {p.inFence ? <CheckCircle2 className="size-3" /> : <TriangleAlert className="size-3" />}
                  {p.gps}
                </span>
                <span className="flex items-center gap-1"><Clock className="size-3" />{p.time.split(",")[0]}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
