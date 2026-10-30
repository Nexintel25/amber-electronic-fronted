"use client";

import Link from "next/link";
import { BadgeCheck, CircleDashed, FilePlus, Hammer, Headset, Hourglass, TriangleAlert } from "lucide-react";
import { api, priorityFromType, statusFromApi, timeAgo } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { STATUS_META, WORKFLOW } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, LinkButton, PageHeader, PageSkeleton, PriorityBadge, StageMeter, StatCard, StatusBadge } from "@/components/ui";

export default function CreatorDashboard() {
  const session = useSession();
  const dash = useApi(() => api.getCreatorDashboard({ active_limit: 5 }));

  if (dash.loading) return <PageSkeleton />;
  if (dash.error || !dash.data)
    return <EmptyState icon={TriangleAlert} title="Could not load your complaints" text={dash.error ?? "No data"} action={<Button onClick={dash.reload}>Try again</Button>} />;

  const { kpis, active_complaints: active } = dash.data;
  return (
    <>
      <PageHeader
        eyebrow="Complaint Creator Portal"
        title={`Welcome, ${session?.user.name.split(" ")[0] ?? ""} 👋`}
        description="Raise new complaints, attach photos or videos, and track every issue in real time."
        actions={
          <>
            <LinkButton href="/creator/complaints" variant="secondary">
              Track complaints
            </LinkButton>
            <LinkButton href="/creator/new">
              <FilePlus /> Raise Complaint
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open complaints" value={kpis.open_complaints} icon={CircleDashed} tone="sky" hint={kpis.overdue_open ? `${kpis.overdue_open} overdue` : "not yet closed"} />
        <StatCard label="Work in progress" value={kpis.work_in_progress} icon={Hammer} tone="amber" hint="field teams on it" />
        <StatCard label="Awaiting verification" value={kpis.awaiting_verification} icon={Hourglass} tone="violet" hint="vendor verification" />
        <StatCard label="Closed" value={kpis.closed_total} icon={BadgeCheck} tone="emerald" hint={`${kpis.resolved_this_month} resolved this month`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader
            title="My active complaints"
            subtitle="Live status of issues you’ve raised"
            action={
              <Link href="/creator/complaints" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100">
            {active.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-400">No active complaints.</li>}
            {active.map((c) => {
              const status = statusFromApi(c.status);
              const priority = priorityFromType(c.complaint_type_name);
              return (
                <li key={c.complaint_id}>
                  <Link href={`/complaints/${c.complaint_id}`} className="flex flex-col gap-3 px-5 py-4 hover:bg-slate-50/70 sm:flex-row sm:items-center">
                    <span className={cn("hidden size-10 shrink-0 place-items-center rounded-xl sm:grid", STATUS_META[status].badge, "ring-1")}>
                      <span className={cn("size-2.5 rounded-full", STATUS_META[status].dot)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-brand-700">{c.complaint_no}</span>
                        <PriorityBadge priority={priority} />
                        {c.is_overdue ? <span className="text-[11px] font-semibold text-rose-600">Overdue</span> : null}
                      </div>
                      <p className="mt-0.5 truncate font-semibold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        {c.area_location ?? c.building_name} · Updated {timeAgo(c.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-1.5 sm:items-end">
                      <StatusBadge status={status} />
                      <StageMeter status={status} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="How your complaint moves" subtitle="7 defined stages — vendor must finish within 15 days" />
            <ol className="space-y-3 px-5 pb-5">
              {WORKFLOW.map((w) => (
                <li key={w.step} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{w.step}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{w.label}</p>
                    <p className="text-xs text-slate-500">{w.action}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-700">
              <Headset className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Need help?</p>
              <p className="text-xs text-slate-500">Hands-on support included for Year 1</p>
            </div>
            <LinkButton href="/support" variant="ghost" size="sm">
              Contact
            </LinkButton>
          </Card>
        </div>
      </div>
    </>
  );
}
