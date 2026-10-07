import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleDashed, FilePlus, Hammer, Headset, Hourglass, Sparkles } from "lucide-react";
import { COMPLAINTS, NOTIFICATIONS } from "@/lib/data";
import { STATUS_META, WORKFLOW } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Card, CardHeader, LinkButton, PageHeader, PriorityBadge, StageMeter, StatCard, StatusBadge } from "@/components/ui";
import { NotificationIcon } from "@/components/notification-icon";

const mine = COMPLAINTS.filter((c) => ["Rohit Mehra", "Anjali Verma"].includes(c.raisedBy));

export default function CreatorDashboard() {
  const active = mine.filter((c) => !["closed", "rejected"].includes(c.status));
  return (
    <>
      <PageHeader
        eyebrow="Complaint Creator Portal"
        title="Good morning, Rohit 👋"
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
        <StatCard label="Open complaints" value={active.length} icon={CircleDashed} tone="sky" hint="across your sites" />
        <StatCard label="Work in progress" value={mine.filter((c) => ["worker_assigned", "in_progress", "rework"].includes(c.status)).length} icon={Hammer} tone="amber" hint="field teams on it" />
        <StatCard label="Awaiting verification" value={mine.filter((c) => ["pending_verification", "completed"].includes(c.status)).length} icon={Hourglass} tone="violet" hint="PM / vendor review" />
        <StatCard label="Resolved this month" value={23} icon={BadgeCheck} tone="emerald" delta="18%" hint="vs last month" />
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
            {active.map((c) => (
              <li key={c.id}>
                <Link href={`/complaints/${c.id}`} className="flex flex-col gap-3 px-5 py-4 hover:bg-slate-50/70 sm:flex-row sm:items-center">
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
          <Card className="overflow-hidden">
            <div className="relative bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white">
              <Sparkles className="absolute top-4 right-4 size-16 text-white/15" />
              <p className="text-lg font-bold">Something not working?</p>
              <p className="mt-1 text-sm text-white/85">Raise a complaint in under a minute. Add photos or a video and we’ll auto-tag the location.</p>
              <LinkButton href="/creator/new" variant="secondary" className="mt-4 border-0 ring-0">
                Raise complaint <ArrowRight />
              </LinkButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="How your complaint moves" subtitle="8 defined stages, fully traceable" />
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

          <Card>
            <CardHeader title="Recent updates" />
            <ul className="space-y-3 px-5 pb-5">
              {NOTIFICATIONS.slice(0, 4).map((n) => (
                <li key={n.id} className="flex gap-3">
                  <NotificationIcon type={n.type} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800">{n.title}</p>
                    <p className="truncate text-xs text-slate-500">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
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
