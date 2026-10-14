"use client";

import { useState } from "react";
import { CalendarDays, Download } from "lucide-react";
import { PRIORITY_MIX, RESOLUTION_BUCKETS, SITES, SLA_BY_SITE, TREND_14D, VENDORS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, PageHeader, Select } from "@/components/ui";
import { Tabs } from "@/components/interactive";
import { Bars, Donut, Legend, SERIES, TrendArea } from "@/components/charts";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = ["6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p"];
// Complaint volume heatmap (day × hour)
const heat = days.map((_, d) => hours.map((_, h) => Math.round(Math.max(0, 9 * Math.sin((h + 1) / 2.6) + (d < 5 ? 4 : -2) + ((d * 7 + h * 3) % 5)))));
const heatMax = Math.max(...heat.flat());
// Sequential single-hue ramp (light → dark)
const ramp = ["#eef4fc", "#cfe0f7", "#a6c6f0", "#78a8e6", "#4f8ddc", "#2a78d6", "#1f5fae", "#174a88"];

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7d" | "14d" | "30d" | "90d">("14d");
  const priorityColors = ["#e34948", "#eb6834", "#eda100", "#94a3b8"];

  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Analytics"
        description="Trends, resolution performance and SLA compliance across vendors and categories."
        actions={
          <Button variant="secondary">
            <Download /> Export PDF
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tabs
          value={range}
          onChange={setRange}
          tabs={[
            { value: "7d", label: "7 days" },
            { value: "14d", label: "14 days" },
            { value: "30d", label: "30 days" },
            { value: "90d", label: "Quarter" },
          ]}
        />
        <Button variant="secondary" size="sm">
          <CalendarDays /> 11 Sep – 24 Sep 2026
        </Button>
        <Select className="h-9 w-48">
          <option>All sites</option>
          {SITES.map((s) => (
            <option key={s.id}>{s.name}</option>
          ))}
        </Select>
        <Select className="h-9 w-52">
          <option>All vendors</option>
          {VENDORS.map((v) => (
            <option key={v.id}>{v.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Complaint volume"
            subtitle="Raised vs resolved per day"
            action={<Legend items={[{ label: "Raised", color: SERIES[1] }, { label: "Resolved", color: SERIES[0] }]} />}
          />
          <div className="px-3 pb-4">
            <TrendArea data={TREND_14D} xKey="day" series={[{ key: "raised", label: "Raised", color: SERIES[1] }, { key: "resolved", label: "Resolved", color: SERIES[0] }]} height={280} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Priority mix" subtitle="Share of complaints" />
          <div className="px-5 pb-5">
            <Donut data={PRIORITY_MIX} colors={priorityColors} centerValue="1,284" centerLabel="total" height={200} />
            <ul className="mt-4 space-y-2">
              {PRIORITY_MIX.map((p, i) => (
                <li key={p.name} className="flex items-center gap-2 text-[13px]">
                  <span className="size-2.5 rounded-sm" style={{ background: priorityColors[i] }} />
                  <span className="text-slate-600">{p.name}</span>
                  <span className="ml-auto font-semibold text-slate-900 tabular-nums">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader title="Resolution time" subtitle="Complaints by time-to-close" />
          <div className="px-3 pb-4">
            <Bars data={RESOLUTION_BUCKETS} xKey="bucket" series={[{ key: "count", label: "Complaints", color: SERIES[0] }]} height={240} />
          </div>
        </Card>

        <Card>
          <CardHeader title="SLA compliance" subtitle="NADT · target 90%" />
          <div className="px-3 pb-4">
            <Bars data={SLA_BY_SITE} xKey="site" layout="vertical" unit="%" series={[{ key: "sla", label: "SLA %", color: SERIES[0] }]} height={240} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Vendor SLA" subtitle="Last 30 days" />
          <div className="space-y-4 px-5 pb-5">
            {VENDORS.map((v) => (
              <div key={v.id}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="font-medium text-slate-700">{v.name}</span>
                  <span className={cn("font-bold tabular-nums", v.sla < 90 ? "text-rose-600" : "text-slate-900")}>{v.sla}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${v.sla}%`, background: SERIES[0] }} />
                  <span className="absolute inset-y-0 w-px bg-slate-900/40" style={{ left: "90%" }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-500">Marker shows 90% target</p>
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader title="When do complaints come in?" subtitle="Volume by weekday and hour — plan shift coverage accordingly" />
          <div className="overflow-x-auto px-5 pb-5">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[48px_repeat(8,1fr)] gap-1.5">
                <span />
                {hours.map((h) => (
                  <span key={h} className="text-center text-[11px] font-medium text-slate-500">{h}</span>
                ))}
                {days.map((d, di) => (
                  <div key={d} className="contents">
                    <span className="flex items-center text-xs font-medium text-slate-500">{d}</span>
                    {heat[di].map((v, hi) => (
                      <span
                        key={hi}
                        title={`${d} ${hours[hi]}: ${v} complaints`}
                        className="grid h-9 place-items-center rounded-md text-[11px] font-semibold"
                        style={{ background: ramp[Math.min(ramp.length - 1, Math.floor((v / heatMax) * (ramp.length - 1)))], color: v / heatMax > 0.55 ? "#fff" : "#334155" }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-500">
                Fewer
                {ramp.map((c) => (
                  <span key={c} className="h-2.5 w-5 rounded-sm" style={{ background: c }} />
                ))}
                More
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
