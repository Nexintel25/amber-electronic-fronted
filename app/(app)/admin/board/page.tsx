"use client";

import Link from "next/link";
import { Timer, TriangleAlert } from "lucide-react";
import { api, toComplaint } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { STATUS_META, WORKFLOW, type StatusKey } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { AvatarStack, Button, EmptyState, LiveDot, PageHeader, PageSkeleton, PriorityBadge } from "@/components/ui";

const columns: { step: number; label: string; owner: string; statuses: StatusKey[] }[] = WORKFLOW.map((w) => ({
  step: w.step,
  label: w.label,
  owner: w.owner,
  statuses: [...w.statuses] as StatusKey[],
}));

export default function StatusBoardPage() {
  const list = useApi(async () => (await api.getComplaints({ limit: 500 })).data.map(toComplaint));
  const COMPLAINTS = list.data ?? [];
  if (list.loading) return <PageSkeleton />;
  if (list.error) return <EmptyState icon={TriangleAlert} title="Could not load the board" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />;
  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Live status board"
        description="Every open complaint, organised by its current stage in the 7-step workflow."
        actions={
          <Button variant="secondary" onClick={list.reload}>
            <LiveDot /> Refresh
          </Button>
        }
      />

      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-max gap-4">
          {columns.map((col) => {
            const items = COMPLAINTS.filter((c) => col.statuses.includes(c.status));
            const meta = STATUS_META[col.statuses[0]];
            return (
              <div key={col.step} className="w-[290px] shrink-0 rounded-2xl bg-slate-100/70 p-3">
                <div className="mb-3 flex items-start justify-between px-1">
                  <div>
                    <p className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
                      <span className={cn("size-2 rounded-full", meta.dot)} />
                      {col.step}. {col.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Owner: {col.owner}</p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map((c) => (
                    <Link
                      key={c.id}
                      href={`/complaints/${c.ref}`}
                      className={cn(
                        "block rounded-xl border-l-4 bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
                        c.status === "rework" ? "border-rose-500" : c.status === "issue_raised" ? "border-fuchsia-500" : c.daysOpen > 15 ? "border-red-600" : c.slaRisk ? "border-orange-500" : "border-transparent",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold text-brand-700">{c.id}</span>
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug font-semibold text-slate-900">{c.title}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">{c.site}</p>
                      {c.status === "rework" && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">↺ Rework required</p>}
                      {c.status === "issue_raised" && <p className="mt-1.5 text-[11px] font-semibold text-fuchsia-600">⚑ Admin issue → vendor</p>}
                      <div className="mt-2.5 flex items-center justify-between">
                        {c.workers ? <AvatarStack names={c.workers} /> : <span className="text-[11px] text-slate-400">{c.vendor ?? "Awaiting vendor"}</span>}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {c.status !== "closed" && (
                            <span className={cn("flex items-center gap-0.5 font-semibold", c.daysOpen > 15 ? "text-rose-600" : c.daysOpen >= 12 ? "text-amber-600" : "")}>
                              <Timer className="size-3" />Day {c.daysOpen}/15
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && <p className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">No complaints</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
