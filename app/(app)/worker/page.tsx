"use client";

import Link from "next/link";
import { BadgeCheck, CalendarClock, ChevronRight, ClipboardList, Gavel, MapPin, RotateCcw } from "lucide-react";
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-brand-700 p-5 text-white shadow-lg shadow-navy-950/20">
        <span className="pointer-events-none absolute -top-10 -right-8 size-40 rounded-full bg-brand-400/20 blur-2xl" />
        <p className="relative text-sm text-slate-300">Hello,</p>
        <h1 className="relative text-2xl font-bold tracking-tight">{session?.user.name}</h1>
        <div className="relative mt-4 grid grid-cols-2 gap-3">
          {[
            { v: todo, l: "To do", i: ClipboardList },
            { v: jobs.data?.kpis.closed_this_month ?? 0, l: "Submitted", i: BadgeCheck },
          ].map((x) => (
            <div key={x.l} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15">
                <x.i className="size-5 text-brand-200" />
              </span>
              <div className="leading-tight">
                <p className="text-2xl font-bold tabular-nums">{x.v}</p>
                <p className="text-[11px] font-medium text-slate-300">{x.l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {GROUPS.map((g) => {
        const list = mine.filter((c) => g.statuses.includes(c.state));
        if (!list.length) return null;
        return (
          <section key={g.title}>
            <h2 className="mb-2.5 flex items-center gap-2 px-1 text-[12px] font-bold tracking-wider text-slate-500 uppercase">
              {g.statuses[0] === "rework" && <RotateCcw className="size-3.5 text-rose-500" />}
              {g.title} <span className="rounded-full bg-slate-200 px-2 py-px text-[11px] text-slate-600">{list.length}</span>
            </h2>
            <ul className="space-y-3">
              {list.map((c) => (
                <li key={c.complaint_id}>
                  <Link href={`/worker/tasks/${c.complaint_id}`} className={cn("relative block overflow-hidden rounded-2xl bg-white p-4 pl-5 shadow-soft ring-1 transition active:scale-[0.98]", c.state === "rework" ? "ring-rose-300" : "ring-slate-200/70")}>
                    <span className={cn("absolute inset-y-0 left-0 w-1.5", c.state === "rework" ? "bg-rose-500" : c.state === "in_progress" ? "bg-amber-400" : c.state === "worker_assigned" ? "bg-brand-500" : "bg-emerald-500")} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-brand-700">{c.complaint_no}</span>
                      <PriorityBadge priority={priorityFromType(c.complaint_type_name)} />
                    </div>
                    <p className="mt-2 text-[16px] leading-snug font-semibold text-slate-900">{c.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{c.area_location ?? c.building_name}</span>
                    </p>
                    <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <StatusBadge status={c.state} />
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", c.sla_state === "red" ? "text-rose-600" : c.sla_state === "yellow" ? "text-amber-600" : "text-slate-500")}>
                        {c.sla_state === "red" ? <Gavel className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                        {c.time_left_minutes === null ? "No SLA" : c.time_left_minutes < 0 ? `${leftText(-c.time_left_minutes)} overdue` : `${leftText(c.time_left_minutes)} left`}
                      </span>
                      <ChevronRight className="size-5 text-slate-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {mine.length === 0 && (
        <div className="rounded-3xl bg-white p-10 text-center shadow-soft ring-1 ring-slate-200/70">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50"><ClipboardList className="size-7 text-brand-500" /></span>
          <p className="mt-4 text-sm text-slate-500">No jobs assigned right now. Your vendor will send new work here.</p>
        </div>
      )}
    </div>
  );
}
