import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { COMPLAINTS, WORKERS } from "@/lib/data";
import { PriorityBadge } from "@/components/ui";

export default function WorkerHistory() {
  const done = COMPLAINTS.filter((c) => c.workers?.includes(WORKERS[0].name) && c.status === "closed");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job history</h1>
      {done.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/70">Closed jobs will appear here.</p>}
      <ul className="space-y-3">
        {done.map((c) => (
          <li key={c.id}>
            <Link href={`/worker/tasks/${c.id}`} className="block rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
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
