"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, Gavel, MapPin, RotateCcw } from "lucide-react";
import { api, priorityFromType, statusFromApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { PriorityBadge, StatusBadge, WorkerSkeleton } from "@/components/ui";

const GROUPS: { title: string; statuses: string[] }[] = [
  { title: "Rework — fix again", statuses: ["rework"] },
  { title: "To start", statuses: ["worker_assigned"] },
  { title: "In progress", statuses: ["in_progress"] },
  { title: "Submitted to vendor", statuses: ["pending_verification", "issue_raised"] },
];

const leftText = (m: number) => (m >= 2880 ? `${Math.floor(m / 1440)}d` : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

export default function WorkerHome() {
  const session = useSession();
  const jobs = useApi(() => api.getWorkerDashboard(50));
  const mine = (jobs.data?.jobs ?? []).map((j) => ({ ...j, state: statusFromApi(j.status) }));
  const todo = jobs.data?.kpis.active_jobs ?? 0;

  if (jobs.loading) return <WorkerSkeleton />;
  if (jobs.error) return <p className="rounded-2xl bg-white p-8 text-center text-sm text-rose-600 ring-1 ring-slate-200/70">{jobs.error}</p>;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500">Hello,</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{session?.user.name}</h1>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-center">
        {[
          { v: todo, l: "To do" },
          { v: jobs.data?.kpis.closed_this_month ?? 0, l: "Submitted" },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-slate-200/70">
            <p className="text-xl font-bold text-slate-900 tabular-nums">{x.v}</p>
            <p className="text-[11px] text-slate-500">{x.l}</p>
          </div>
        ))}
      </div>

      {GROUPS.map((g) => {
        const list = mine.filter((c) => g.statuses.includes(c.state));
        if (!list.length) return null;
        return (
          <section key={g.title}>
            <h2 className="mb-2 flex items-center gap-2 text-[13px] font-bold tracking-wide text-slate-500 uppercase">
              {g.statuses[0] === "rework" && <RotateCcw className="size-3.5 text-rose-500" />}
              {g.title} <span className="rounded-full bg-slate-200 px-1.5 text-[11px] text-slate-600">{list.length}</span>
            </h2>
            <ul className="space-y-3">
              {list.map((c) => (
                <li key={c.complaint_id}>
                  <Link href={`/worker/tasks/${c.complaint_id}`} className={cn("block rounded-2xl bg-white p-4 shadow-soft ring-1 transition active:scale-[0.99]", c.state === "rework" ? "ring-rose-300" : "ring-slate-200/70")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-brand-700">{c.complaint_no}</span>
                      <PriorityBadge priority={priorityFromType(c.complaint_type_name)} />
                    </div>
                    <p className="mt-1.5 text-[15px] leading-snug font-semibold text-slate-900">{c.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{c.area_location ?? c.building_name}</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusBadge status={c.state} />
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", c.sla_state === "red" ? "text-rose-600" : c.sla_state === "yellow" ? "text-amber-600" : "text-slate-500")}>
                        {c.sla_state === "red" ? <Gavel className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                        {c.time_left_minutes === null ? "No SLA" : c.time_left_minutes < 0 ? `${leftText(-c.time_left_minutes)} overdue` : `${leftText(c.time_left_minutes)} left`}
                      </span>
                      <ChevronRight className="size-5 text-slate-300" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {mine.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/70">No jobs assigned right now. Your vendor will send new work here.</p>}
    </div>
  );
}
