import Link from "next/link";
import { CalendarClock, ChevronRight, Gavel, MapPin, RotateCcw } from "lucide-react";
import { COMPLAINTS, WORKERS } from "@/lib/data";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/components/ui";

const ME = WORKERS[0];

const GROUPS: { title: string; statuses: string[] }[] = [
  { title: "Rework — fix again", statuses: ["rework"] },
  { title: "To start", statuses: ["worker_assigned"] },
  { title: "In progress", statuses: ["in_progress"] },
  { title: "Submitted to vendor", statuses: ["pending_verification", "issue_raised"] },
];

export default function WorkerHome() {
  const mine = COMPLAINTS.filter((c) => c.workers?.includes(ME.name) && c.status !== "closed");
  const todo = mine.filter((c) => ["rework", "worker_assigned", "in_progress"].includes(c.status)).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-500">Hello,</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{ME.name}</h1>
        <p className="text-[13px] text-slate-500">{ME.skill} · Team {ME.team} · {ME.vendor}</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center">
        {[
          { v: todo, l: "To do" },
          { v: `${ME.completed}/${ME.tasksToday}`, l: "Done today" },
          { v: ME.rating, l: "Rating" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-slate-200/70">
            <p className="text-xl font-bold text-slate-900 tabular-nums">{s.v}</p>
            <p className="text-[11px] text-slate-500">{s.l}</p>
          </div>
        ))}
      </div>

      {GROUPS.map((g) => {
        const list = mine.filter((c) => g.statuses.includes(c.status));
        if (!list.length) return null;
        return (
          <section key={g.title}>
            <h2 className="mb-2 flex items-center gap-2 text-[13px] font-bold tracking-wide text-slate-500 uppercase">
              {g.statuses[0] === "rework" && <RotateCcw className="size-3.5 text-rose-500" />}
              {g.title} <span className="rounded-full bg-slate-200 px-1.5 text-[11px] text-slate-600">{list.length}</span>
            </h2>
            <ul className="space-y-3">
              {list.map((c) => (
                <li key={c.id}>
                  <Link href={`/worker/tasks/${c.id}`} className={cn("block rounded-2xl bg-white p-4 shadow-soft ring-1 transition active:scale-[0.99]", c.status === "rework" ? "ring-rose-300" : "ring-slate-200/70")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-brand-700">{c.id}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="mt-1.5 text-[15px] leading-snug font-semibold text-slate-900">{c.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusBadge status={c.status} />
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", c.daysOpen > PENALTY_AFTER_DAYS ? "text-rose-600" : c.daysOpen >= 12 ? "text-amber-600" : "text-slate-500")}>
                        {c.daysOpen > PENALTY_AFTER_DAYS ? <Gavel className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                        Day {c.daysOpen}/{PENALTY_AFTER_DAYS}
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
