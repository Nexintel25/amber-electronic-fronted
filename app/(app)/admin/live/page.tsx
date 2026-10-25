"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, ClipboardList, HardHat } from "lucide-react";
import { api, rowsOf, num } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { projector, toWorker } from "@/lib/worker-map";
import { statusFromApi } from "@/lib/api";
import { STATUS_META } from "@/lib/workflow";
import { WORKER_STATUS } from "@/lib/worker-status";
import { cn } from "@/lib/utils";
import { Avatar, Card, LiveDot, NoData, PageHeader, Select, StatusBadge } from "@/components/ui";
import { Tabs } from "@/components/interactive";
import { LiveMap, MapLegend, type MapPoint } from "@/components/live-map";

export default function LiveTrackingPage() {
  const [layer, setLayer] = useState<"all" | "workers" | "complaints">("all");
  const [site, setSite] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const dash = useApi(() => api.getAdminDashboard());
  const buildings = useApi(() => api.getBuildings());
  const rawWorkers = rowsOf(dash.data?.workers).map(toWorker);
  const rawComplaints = (dash.data?.map_complaints ?? []).map((c) => ({ ...c, lat: num(c.latitude), lng: num(c.longitude), status: statusFromApi(c.status) }));
  const proj = projector([...rawWorkers, ...rawComplaints]);
  const workers = rawWorkers.filter((w) => !site || w.site === site).map((w) => ({ ...w, ...proj(w.lat, w.lng) }));
  const complaints = rawComplaints.filter((c) => !["closed", "rejected"].includes(c.status) && (!site || c.building_name === site)).map((c) => ({ ...c, id: c.complaint_no, ref: c.complaint_id, ...proj(c.lat, c.lng) }));

  const points: MapPoint[] = [
    ...(layer !== "complaints"
      ? workers.map((w) => ({ id: w.id, x: w.x, y: w.y, kind: "worker" as const, tone: WORKER_STATUS[w.status].tone, label: w.name, sub: `${w.status} · ${w.lastPing}`, live: w.status !== "Offline" }))
      : []),
    ...(layer !== "workers"
      ? complaints.map((c) => ({ id: c.id, x: c.x, y: c.y, kind: "complaint" as const, tone: "violet" as const, label: `${c.id} · ${STATUS_META[c.status].label}`, sub: c.title }))
      : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Live tracking"
        description="Every worker’s GPS position and every open complaint — updated in real time."
        actions={
          <span className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <LiveDot /> Live tracking
          </span>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={layer}
          onChange={setLayer}
          tabs={[
            { value: "all", label: "All layers" },
            { value: "workers", label: <span className="flex items-center gap-1.5"><HardHat className="size-4" />Workers</span>, count: workers.length },
            { value: "complaints", label: <span className="flex items-center gap-1.5"><ClipboardList className="size-4" />Complaints</span>, count: complaints.length },
          ]}
        />
        <Select value={site} onChange={(e) => setSite(e.target.value)} className="w-56">
          <option value="">All sites</option>
          {buildings.data?.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-3">
          <LiveMap className="h-[480px] xl:h-[640px]" points={points} selected={sel} onSelect={setSel} />
          <div className="px-2 pt-3">
            <MapLegend items={[{ label: "On task", tone: "amber" }, { label: "Travelling", tone: "blue" }, { label: "Available", tone: "green" }, { label: "Offline", tone: "slate" }, { label: "Open complaint", tone: "violet" }, { label: "SLA risk", tone: "red" }]} />
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["On Task", "Travelling", "Available", "Offline"] as const).map((s) => (
              <Card key={s} className="p-3.5">
                <span className={cn("block size-2.5 rounded-full", WORKER_STATUS[s].dot)} />
                <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{workers.filter((w) => w.status === s).length}</p>
                <p className="text-xs text-slate-500">{s}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">Field workers</p>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {workers.length === 0 && <li><NoData /></li>}
              {workers.map((w) => (
                <li key={w.id}>
                  <button onClick={() => setSel(w.id)} className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left", sel === w.id ? "bg-brand-50/60" : "hover:bg-slate-50")}>
                    <Avatar name={w.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-800">{w.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{w.site}</p>
                    </div>
                    <span className={cn("size-2 rounded-full", WORKER_STATUS[w.status].dot)} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <p className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900"><Building className="size-4" /> Open complaints</p>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {complaints.length === 0 && <li><NoData /></li>}
              {complaints.map((c) => (
                <li key={c.id}>
                  <Link href={`/complaints/${c.ref}`} className="block px-4 py-2.5 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-brand-700">{c.id}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[13px] font-medium text-slate-700">{c.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
