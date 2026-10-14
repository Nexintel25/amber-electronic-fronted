"use client";

import Link from "next/link";
import { CircleAlert, FileText, Gauge, Hourglass, ShieldCheck, Timer } from "lucide-react";
import { SLA_HOURS } from "@/lib/workflow";
import { fmtDue, fmtDuration, slaLabel, slaRows, slaSummary, type Sla } from "@/lib/sla";
import { cn } from "@/lib/utils";
import { Badge, Card, CardHeader, EmptyState, LinkButton, PageHeader, PriorityBadge, StatCard, StatusBadge, td, th } from "@/components/ui";
import { useSlaScope } from "@/components/sla-scope";
import type { Priority } from "@/lib/workflow";

const stateTone: Record<Sla["state"], string> = {
  "On track": "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  "At risk": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Overdue: "bg-red-600 text-white ring-red-700/20",
  Met: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Missed: "bg-rose-50 text-rose-700 ring-rose-600/15",
};

export default function SlaPage() {
  const scope = useSlaScope();
  const rows = slaRows(scope.scoped ? scope.vendors : undefined);
  const sum = slaSummary(rows);
  const running = rows.filter((r) => r.state === "On track" || r.state === "At risk").sort((a, b) => a.leftMin - b.leftMin);
  const outside = rows.filter((r) => r.state === "Overdue" || r.state === "Missed").sort((a, b) => a.leftMin - b.leftMin);

  return (
    <>
      <PageHeader
        eyebrow={`SLA tracking · ${scope.label}`}
        title="SLA tracker"
        description="How much time is left on each job against its priority’s resolution target — and which jobs have already gone past it."
        actions={
          <LinkButton href="/sla/report" variant="secondary">
            <FileText /> SLA report
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="SLA compliance" value={`${sum.compliance}%`} icon={ShieldCheck} tone={sum.compliance >= 90 ? "emerald" : "rose"} hint="target 90%" />
        <StatCard label="Running on time" value={sum.onTrack} icon={Timer} tone="sky" hint="inside the duration" />
        <StatCard label="At risk" value={sum.atRisk} icon={Hourglass} tone="amber" hint="close to the limit" />
        <StatCard label="Outside duration" value={sum.overdue + sum.missed} icon={CircleAlert} tone="rose" hint={`${sum.overdue} still open · ${sum.missed} closed late`} />
      </div>

      <Card className="mt-6 p-5">
        <p className="mb-3 text-[15px] font-semibold text-slate-900">Resolution time by priority</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(Object.keys(SLA_HOURS) as Priority[]).map((p) => {
            const list = rows.filter((r) => r.complaint.priority === p);
            const bad = list.filter((r) => r.state === "Overdue" || r.state === "Missed").length;
            return (
              <div key={p} className="rounded-xl border border-slate-100 p-3.5">
                <div className="flex items-center justify-between">
                  <PriorityBadge priority={p} />
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{SLA_HOURS[p]} h</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {list.length} job{list.length === 1 ? "" : "s"} ·{" "}
                  <span className={cn("font-semibold", bad ? "text-rose-600" : "text-emerald-600")}>{bad} outside duration</span>
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Time left" subtitle="Jobs still inside their duration — least time first" icon={Gauge} />
        {running.length === 0 ? (
          <EmptyState icon={Timer} title="Nothing running" text="No open jobs are inside their SLA duration right now." />
        ) : (
          <SlaTable rows={running} kind="left" />
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Outside duration" subtitle="Jobs that went past their SLA — longest overdue first" icon={CircleAlert} />
        {outside.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No SLA breaches" text="Every job is inside its resolution time." />
        ) : (
          <SlaTable rows={outside} kind="over" />
        )}
      </Card>
    </>
  );
}

function SlaTable({ rows, kind }: { rows: Sla[]; kind: "left" | "over" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50/70">
          <tr>
            <th className={th}>Complaint</th>
            <th className={th}>Vendor</th>
            <th className={th}>Priority</th>
            <th className={th}>Target</th>
            <th className={th}>Due by</th>
            <th className={cn(th, "w-48")}>Duration used</th>
            <th className={th}>{kind === "left" ? "Time left" : "Overdue by"}</th>
            <th className={th}>State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const c = r.complaint;
            return (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className={cn(td, "max-w-[300px]")}>
                  <Link href={`/complaints/${c.id}`} className="block">
                    <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                    <span className="block truncate font-semibold text-slate-900">{c.title}</span>
                    <span className="mt-0.5 block"><StatusBadge status={c.status} /></span>
                  </Link>
                </td>
                <td className={td}>{c.vendor ?? "—"}</td>
                <td className={td}><PriorityBadge priority={c.priority} /></td>
                <td className={td}>{r.targetHours} h</td>
                <td className={td}>{fmtDue(r.due)}</td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={cn("h-full rounded-full", r.usedPct > 100 ? "bg-rose-500" : r.usedPct > 75 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, r.usedPct)}%` }} />
                    </div>
                    <span className="w-12 text-right text-xs font-semibold text-slate-600 tabular-nums">{r.usedPct > 999 ? "999%+" : `${Math.round(r.usedPct)}%`}</span>
                  </div>
                </td>
                <td className={cn(td, "font-bold tabular-nums", kind === "over" ? "text-rose-600" : r.state === "At risk" ? "text-amber-600" : "text-slate-900")}>
                  {kind === "over" ? `+${fmtDuration(r.leftMin)}` : slaLabel(r)}
                </td>
                <td className={td}><Badge className={stateTone[r.state]}>{r.state}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
