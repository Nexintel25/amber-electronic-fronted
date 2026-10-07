import Link from "next/link";
import { Camera, Timer } from "lucide-react";
import { COMPLAINTS } from "@/lib/data";
import { STATUS_META, WORKFLOW, type StatusKey } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { AvatarStack, LiveDot, PageHeader, PriorityBadge } from "@/components/ui";

const columns: { step: number; label: string; owner: string; statuses: StatusKey[] }[] = WORKFLOW.map((w) => ({
  step: w.step,
  label: w.label,
  owner: w.owner,
  statuses: w.key === "completed" ? ["completed", "rework"] : [w.key as StatusKey],
}));

export default function StatusBoardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Live status board"
        description="Every open complaint, organised by its current stage in the 8-step workflow."
        actions={
          <span className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <LiveDot /> Auto-refreshing
          </span>
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
                      href={`/complaints/${c.id}`}
                      className={cn(
                        "block rounded-xl border-l-4 bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
                        c.status === "rework" ? "border-rose-500" : c.slaRisk ? "border-orange-500" : "border-transparent",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold text-brand-700">{c.id}</span>
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug font-semibold text-slate-900">{c.title}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">{c.site}</p>
                      {c.status === "rework" && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">↺ Rework required</p>}
                      <div className="mt-2.5 flex items-center justify-between">
                        {c.workers ? <AvatarStack names={c.workers} /> : <span className="text-[11px] text-slate-400">{c.vendor ?? "Awaiting vendor"}</span>}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-0.5"><Camera className="size-3" />{c.media.photos}</span>
                          {c.slaLeft && (
                            <span className={cn("flex items-center gap-0.5 font-semibold", c.slaRisk ? "text-rose-600" : "")}>
                              <Timer className="size-3" />{c.slaLeft}
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
