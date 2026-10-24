"use client";

import Link from "next/link";
import { BadgeCheck, CircleDashed, FilePlus, Hammer, Headset, Hourglass, Loader2, TriangleAlert } from "lucide-react";
import { api, toComplaint } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { STATUS_META, WORKFLOW } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, LinkButton, PageHeader, PriorityBadge, StageMeter, StatCard, StatusBadge } from "@/components/ui";

export default function CreatorDashboard() {
  const session = useSession();
  // The API scopes the list to the signed-in user, so everything returned here is "mine".
  const complaints = useApi(async () => (await api.getComplaints({ limit: 200 })).data.map(toComplaint));

  if (complaints.loading) return <div className="grid place-items-center py-32 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>;
  if (complaints.error || !complaints.data)
    return <EmptyState icon={TriangleAlert} title="Could not load your complaints" text={complaints.error ?? "No data"} action={<Button onClick={complaints.reload}>Try again</Button>} />;

  const mine = complaints.data;
  const active = mine.filter((c) => !["closed", "rejected"].includes(c.status));
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
        <StatCard label="Open complaints" value={active.length} icon={CircleDashed} tone="sky" hint="not yet closed" />
        <StatCard label="Work in progress" value={mine.filter((c) => ["worker_assigned", "in_progress", "rework"].includes(c.status)).length} icon={Hammer} tone="amber" hint="field teams on it" />
        <StatCard label="Awaiting verification" value={mine.filter((c) => ["pending_verification", "issue_raised"].includes(c.status)).length} icon={Hourglass} tone="violet" hint="vendor verification" />
        <StatCard label="Closed" value={mine.filter((c) => c.status === "closed").length} icon={BadgeCheck} tone="emerald" hint="resolved complaints" />
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
            {active.map((c) => (
              <li key={c.id}>
                <Link href={`/complaints/${c.ref}`} className="flex flex-col gap-3 px-5 py-4 hover:bg-slate-50/70 sm:flex-row sm:items-center">
                  <span className={cn("hidden size-10 shrink-0 place-items-center rounded-xl sm:grid", STATUS_META[c.status].badge, "ring-1")}>
                    <span className={cn("size-2.5 rounded-full", STATUS_META[c.status].dot)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="mt-0.5 truncate font-semibold text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.location} · Updated {c.updatedAt}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <StatusBadge status={c.status} />
                    <StageMeter status={c.status} />
                  </div>
                </Link>
              </li>
            ))}
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
