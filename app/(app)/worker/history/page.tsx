"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { api, fmtDate } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { JobCardsSkeleton } from "@/components/ui";

export default function WorkerHistory() {
  const jobs = useApi(() => api.getWorkerDashboard(1));
  const done = jobs.data?.history ?? [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job history</h1>
      {jobs.loading && <JobCardsSkeleton cards={4} />}
      {jobs.error && <p className="rounded-2xl bg-white p-8 text-center text-sm text-rose-600 ring-1 ring-slate-200/70">{jobs.error}</p>}
      {!jobs.loading && !jobs.error && done.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/70">Closed jobs will appear here.</p>}
      <ul className="space-y-3">
        {done.map((c) => (
          <li key={c.complaint_id}>
            <Link href={`/worker/tasks/${c.complaint_id}`} className="block rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-700">{c.complaint_no}</span>
                {c.first_time_fix ? <span className="text-[11px] font-semibold text-emerald-600">First-time fix</span> : c.rework_count > 0 ? <span className="text-[11px] font-semibold text-rose-600">{c.rework_count} rework</span> : null}
              </div>
              <p className="mt-1.5 font-semibold text-slate-900">{c.title}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <BadgeCheck className="size-4" /> Verified & closed · {fmtDate(c.closed_at)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
