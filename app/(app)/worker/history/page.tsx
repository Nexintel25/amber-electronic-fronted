"use client";

import Link from "next/link";
import { BadgeCheck, Loader2 } from "lucide-react";
import { api, toComplaint } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { PriorityBadge } from "@/components/ui";

export default function WorkerHistory() {
  const jobs = useApi(async () => (await api.getComplaints({ status: "CLOSED", limit: 200 })).data.map(toComplaint));
  const done = (jobs.data ?? []).filter((c) => c.status === "closed");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job history</h1>
      {jobs.loading && <div className="grid place-items-center py-16 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>}
      {jobs.error && <p className="rounded-2xl bg-white p-8 text-center text-sm text-rose-600 ring-1 ring-slate-200/70">{jobs.error}</p>}
      {!jobs.loading && !jobs.error && done.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/70">Closed jobs will appear here.</p>}
      <ul className="space-y-3">
        {done.map((c) => (
          <li key={c.id}>
            <Link href={`/worker/tasks/${c.ref}`} className="block rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-700">{c.id}</span>
                <PriorityBadge priority={c.priority} />
              </div>
              <p className="mt-1.5 font-semibold text-slate-900">{c.title}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <BadgeCheck className="size-4" /> Verified & closed · {c.updatedAt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
