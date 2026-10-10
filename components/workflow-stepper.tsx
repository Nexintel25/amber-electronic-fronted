import { Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META, WORKFLOW, type StatusKey } from "@/lib/workflow";

/** Horizontal 7-stage workflow stepper (collapses to vertical on mobile). */
export function WorkflowStepper({ status }: { status: StatusKey }) {
  const current = STATUS_META[status].step;
  const isRework = status === "rework";
  const isRejected = status === "rejected";
  const isClosed = status === "closed";
  const isIssue = status === "issue_raised";

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:grid-cols-7 lg:gap-0">
      {WORKFLOW.map((w, i) => {
        const done = isClosed || w.step < current;
        const active = !isClosed && w.step === current;
        const failed = (isRejected && w.step === 2) || ((isRework || isIssue) && w.step === 6);
        return (
          <li key={w.step} className="relative flex items-start gap-3 lg:flex-col lg:items-center lg:gap-2 lg:text-center">
            {i < WORKFLOW.length - 1 && (
              <span
                className={cn(
                  "absolute top-4 left-[calc(50%+18px)] hidden h-0.5 w-[calc(100%-36px)] lg:block",
                  done ? "bg-emerald-500" : "bg-slate-200",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white",
                failed
                  ? "bg-rose-500 text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-brand-500 text-white shadow-lg shadow-brand-500/40"
                      : "bg-slate-100 text-slate-400",
              )}
            >
              {failed ? isRework || isIssue ? <RotateCcw className="size-4" /> : <X className="size-4" /> : done ? <Check className="size-4" /> : w.step}
            </span>
            <div className="min-w-0 lg:px-1">
              <p className={cn("text-[13px] leading-tight font-semibold", active || failed ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400")}>
                {failed ? (isRework ? "Rework Required" : isIssue ? "Issue Raised" : "Rejected") : w.label}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{w.owner}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
