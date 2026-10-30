"use client";

import { useState } from "react";
import Link from "next/link";
import { Battery, Clock, Crosshair, MessageSquare, Phone, Search, Signal, TriangleAlert, WifiOff } from "lucide-react";
import { api, pick, rowsOf, text, timeText } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { projector, toWorker, type MapWorker } from "@/lib/worker-map";
import { WORKER_STATUS, type WorkerStatus } from "@/lib/worker-status";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, EmptyState, Input, ListSkeleton, LiveDot, NoData, PageHeader } from "@/components/ui";
import { Tabs } from "@/components/interactive";
import { LiveMap, MapLegend } from "@/components/live-map";

type W = MapWorker;

export default function MonitoringPage() {
  const [filter, setFilter] = useState<"all" | WorkerStatus>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const dash = useApi(() => api.getPmDashboard());
  const raw = rowsOf(dash.data?.workers).map(toWorker);
  const proj = projector(raw);
  const WORKERS = raw.map((w) => ({ ...w, ...proj(w.lat, w.lng) }));
  const list = WORKERS.filter((w) => (filter === "all" || w.status === filter) && w.name.toLowerCase().includes(q.toLowerCase()));
  const real = WORKERS.find((x) => x.id === sel);
  const detail = useApi(() => (sel ? api.getPmWorkerDetail(Number(sel)) : Promise.resolve(null)), [sel]);
  const d = detail.data;
  const w: W = real ?? { id: "", name: "—", skill: "—", team: "—", site: "", status: "Offline", battery: undefined, lastPing: "—", x: 0, y: 0 };
  const name = text(pick(d, "name", "worker_name"), w.name);
  const complaintNo = pick(d, "complaint_no", "current_complaint_no") as string | undefined;
  const task = complaintNo ? { id: String(pick(d, "complaint_id") ?? complaintNo), no: complaintNo, title: text(pick(d, "complaint_title", "title")), location: text(pick(d, "area_location", "location")) } : undefined;
  const activity = rowsOf(pick(d, "activity", "timeline", "today_activity", "history"));
  const count = (s: WorkerStatus) => WORKERS.filter((x) => x.status === s).length;

  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel"
        title="Field monitoring"
        description="Real-time GPS positions and check-ins for the workers of the vendors you are responsible for."
        actions={
          <span className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <LiveDot /> Live
          </span>
        }
      />

      <Tabs
        value={filter}
        onChange={setFilter}
        className="mb-4 w-fit"
        tabs={[
          { value: "all", label: "All workers", count: WORKERS.length },
          { value: "On Task", label: "On task", count: count("On Task") },
          { value: "Travelling", label: "Travelling", count: count("Travelling") },
          { value: "Available", label: "Available", count: count("Available") },
          { value: "Offline", label: "Offline", count: count("Offline") },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <Card className="overflow-hidden xl:self-start">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find worker" className="pl-9" />
            </div>
          </div>
          {dash.loading && <ListSkeleton rows={4} className="rounded-none shadow-none ring-0" />}
          {dash.error && <EmptyState icon={TriangleAlert} title="Could not load workers" text={dash.error} action={<Button onClick={dash.reload}>Try again</Button>} />}
          <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
            {!dash.loading && list.length === 0 && <li><NoData /></li>}
            {list.map((x) => (
              <li key={x.id}>
                <button onClick={() => setSel(x.id)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left", sel === x.id ? "bg-brand-50/60" : "hover:bg-slate-50")}>
                  <span className="relative">
                    <Avatar name={x.name} />
                    <span className={cn("absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-white", WORKER_STATUS[x.status].dot)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-slate-800">{x.name}</p>
                    <p className="truncate text-xs text-slate-500">{x.task ?? x.skill}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{x.lastPing}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-3">
          <LiveMap
            className="h-[420px] xl:h-[600px]"
            selected={sel}
            onSelect={setSel}
            points={[
              ...list.map((x) => ({ id: x.id, x: x.x, y: x.y, kind: "worker" as const, tone: WORKER_STATUS[x.status].tone, label: x.name, sub: `${x.status} · ${x.lastPing}`, live: x.status !== "Offline" })),
            ]}
          />
          <div className="px-2 pt-3">
            <MapLegend items={[{ label: "On task", tone: "amber" }, { label: "Travelling", tone: "blue" }, { label: "Available", tone: "green" }, { label: "Offline", tone: "slate" }, { label: "Complaint", tone: "violet" }, { label: "SLA risk", tone: "red" }]} />
          </div>
        </Card>

        {(
          <Card className="xl:self-start">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <Avatar name={name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">{w.skill} · Team {w.team}</p>
                {real ? <Badge className={cn("mt-1.5", WORKER_STATUS[w.status].badge)} dot={WORKER_STATUS[w.status].dot}>{w.status}</Badge> : <NoData className="px-0 py-1 text-left" />}
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 text-center">
              {[
                { i: Battery, v: w.battery != null ? `${w.battery}%` : "—", l: "Battery", bad: w.battery != null && w.battery < 20 },
                { i: w.status === "Offline" ? WifiOff : Signal, v: !real ? "—" : w.status === "Offline" ? "Offline" : "4G", l: "Network", bad: !!real && w.status === "Offline" },
                { i: Clock, v: w.lastPing, l: "Last ping", bad: false },
              ].map((s) => (
                <div key={s.l} className="py-3">
                  <s.i className={cn("mx-auto size-4", s.bad ? "text-rose-500" : "text-slate-400")} />
                  <p className={cn("mt-1 text-[13px] font-bold", s.bad ? "text-rose-600" : "text-slate-800")}>{s.v}</p>
                  <p className="text-[10px] text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4 p-5">
              {task ? (
                <Link href={`/complaints/${task.id}`} className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                  <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Current task</p>
                  <p className="mt-1 font-mono text-xs font-bold text-brand-700">{task.no}</p>
                  <p className="text-[13.5px] font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.location}</p>
                </Link>
              ) : (
                <p className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-500">{detail.loading && sel ? "Loading…" : "No active task."}</p>
              )}
              <div>
                <p className="mb-2 text-[13px] font-semibold text-slate-700">Today’s activity</p>
                <ol className="space-y-2.5">
                  {activity.length === 0 && <li><NoData className="px-0 py-3 text-left" /></li>}
                  {activity.map((a, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px]">
                      <Crosshair className="size-4 text-brand-500" />
                      <span className="flex-1 text-slate-700">{text(pick(a, "title", "description", "event"))}</span>
                      <span className="text-xs text-slate-400">{timeText(pick(a, "time", "event_time", "created_at"))}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={!pick(d, "phone", "worker_phone")} onClick={() => (window.location.href = `tel:${pick(d, "phone", "worker_phone")}`)}><Phone /> Call</Button>
                <Button variant="secondary"><MessageSquare /> Message</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
