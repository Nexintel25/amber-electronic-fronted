"use client";

import { useState } from "react";
import { CalendarDays, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button, Card, CardHeader, NoData, PageHeader, Select } from "@/components/ui";
import { Tabs } from "@/components/interactive";
import { Bars, Donut, Legend, SERIES, TrendArea } from "@/components/charts";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = ["6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p"];
// Complaint volume heatmap (day × hour)
// No API yet for the weekday × hour volume, so every cell stays empty.
const heat = days.map(() => hours.map(() => 0));
const heatMax = Math.max(1, ...heat.flat());
// Sequential single-hue ramp (light → dark)
const ramp = ["#eef4fc", "#cfe0f7", "#a6c6f0", "#78a8e6", "#4f8ddc", "#2a78d6", "#1f5fae", "#174a88"];

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7d" | "14d" | "30d" | "90d">("14d");
  const [site, setSite] = useState("");
  const [vendor, setVendor] = useState("");
  const dash = useApi(() => api.getAdminDashboard());
  const buildings = useApi(() => api.getBuildings());
  const vendors = useApi(() => api.getVendors());

  const trendAll = dash.data?.trend ?? [];
  const trend = trendAll.slice(range === "7d" ? -7 : 0).map((t) => ({ day: t.day, raised: Number(t.raised), resolved: Number(t.resolved) }));
  const categories = (dash.data?.categories ?? []).map((c) => ({ name: c.category_name, value: Number(c.total) }));
  const slaBySite = (dash.data?.sites ?? [])
    .filter((x) => !site || String(x.building_id) === site)
    .filter((x) => x.sla_compliance_pct != null)
    .map((x) => ({ site: x.building_name, sla: Number(x.sla_compliance_pct) }));
  const RESOLUTION_BUCKETS: { bucket: string; count: number }[] = []; // no API yet

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
          <CalendarDays /> —
        </Button>
        <Select className="h-9 w-48" value={site} onChange={(e) => setSite(e.target.value)}>
          <option value="">All sites</option>
          {buildings.data?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
        <Select className="h-9 w-52" value={vendor} onChange={(e) => setVendor(e.target.value)}>
          <option value="">All vendors</option>
          {vendors.data?.map((v) => (
            <option key={v.id} value={v.id}>{v.company_name}</option>
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
            <TrendArea data={trend} xKey="day" series={[{ key: "raised", label: "Raised", color: SERIES[1] }, { key: "resolved", label: "Resolved", color: SERIES[0] }]} height={280} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Complaints by category" subtitle="Share of complaints" />
          <div className="px-5 pb-5">
            <Donut data={categories} centerValue={categories.length ? String(categories.reduce((a, p) => a + p.value, 0)) : "—"} centerLabel="total" height={200} />
            <ul className="mt-4 space-y-2">
              {categories.map((p, i) => (
                <li key={p.name} className="flex items-center gap-2 text-[13px]">
                  <span className="size-2.5 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} />
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
            <Bars data={RESOLUTION_BUCKETS} xKey="bucket" series={[{ key: "count", label: "Complaints", color: SERIES[0] }]} height={240} noApi />
          </div>
        </Card>

        <Card>
          <CardHeader title="SLA compliance" subtitle="By site" />
          <div className="px-3 pb-4">
            <Bars data={slaBySite} xKey="site" layout="vertical" unit="%" series={[{ key: "sla", label: "SLA %", color: SERIES[0] }]} height={240} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Vendor SLA" subtitle="Last 30 days" />
          <div className="space-y-4 px-5 pb-5">
            <NoData noApi />
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
                        title={`${d} ${hours[hi]}`}
                        className="grid h-9 place-items-center rounded-md text-[11px] font-semibold"
                        style={{ background: ramp[Math.min(ramp.length - 1, Math.floor((v / heatMax) * (ramp.length - 1)))], color: v / heatMax > 0.55 ? "#fff" : "#334155" }}
                      >
                        –
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
