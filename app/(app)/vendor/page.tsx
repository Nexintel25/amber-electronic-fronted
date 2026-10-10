import Link from "next/link";
import { BadgeCheck, Clock, Gavel, HardHat, Inbox, Star } from "lucide-react";
import { COMPLAINTS, VENDORS, WORKERS, inr, penaltyOf } from "@/lib/data";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Card, CardHeader, LinkButton, PageHeader, PriorityBadge, Progress, StatCard, StatusBadge } from "@/components/ui";
import { Bars, Legend, SERIES } from "@/components/charts";

const me = VENDORS[0];

export default function VendorDashboard() {
  const mineAll = COMPLAINTS.filter((c) => c.vendor === me.name);
  const queue = COMPLAINTS.filter((c) => c.status === "new" || c.status === "vendor_review");
  const field = mineAll.filter((c) => ["worker_assigned", "in_progress", "rework"].includes(c.status));
  const verify = mineAll.filter((c) => c.status === "pending_verification" || c.status === "issue_raised");
  const penalty = mineAll.map(penaltyOf).reduce((a, p) => a + p.amount, 0);
  const clock = mineAll.filter((c) => c.status !== "closed" && c.status !== "rejected").sort((a, b) => b.daysOpen - a.daysOpen).slice(0, 5);
  const workers = WORKERS.filter((w) => w.vendor === me.name);

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel · PowerGrid Services"
        title="Vendor dashboard"
        description="New complaints reach you together with the Admin and Project Manager. Distribute them to your workers, verify their photos and close within 15 days."
        actions={
          <LinkButton href="/vendor/queue">
            <Inbox /> Review & distribute
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting review" value={queue.length} icon={Inbox} tone="violet" hint="new complaints" />
        <StatCard label="With my workers" value={field.length} icon={HardHat} tone="amber" hint="in the field / rework" />
        <StatCard label="To verify" value={verify.length} icon={BadgeCheck} tone="emerald" hint="worker photos & admin issues" />
        <StatCard label="Penalty exposure" value={inr(penalty)} icon={Gavel} tone="rose" hint={`beyond ${PENALTY_AFTER_DAYS} days`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Review queue"
            subtitle="Accept, reject or distribute to workers — oldest first"
            action={<Link href="/vendor/queue" className="text-[13px] font-semibold text-brand-600">Review all</Link>}
          />
          <ul className="divide-y divide-slate-100">
            {queue.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 truncate font-semibold text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">
                    {c.site} · {c.location} · raised {c.raisedAt}
                  </p>
                </div>
                <LinkButton href="/vendor/queue" size="sm" variant="secondary">
                  Review
                </LinkButton>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="My performance" subtitle="Last 30 days" />
          <div className="space-y-4 px-5 pb-5">
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 p-4 text-white">
              <div className="flex-1">
                <p className="text-xs text-slate-300">SLA compliance</p>
                <p className="text-3xl font-bold tabular-nums">{me.sla}%</p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-xl font-bold">
                  <Star className="size-4 fill-brand-400 text-brand-400" />
                  {me.rating}
                </p>
                <p className="text-xs text-slate-300">client rating</p>
              </div>
            </div>
            {[
              { l: "Closed / assigned", v: `${me.closed}/${me.assigned}`, p: (me.closed / me.assigned) * 100 },
              { l: "Avg turnaround", v: `${me.avgTat} h`, p: 64 },
              { l: "Rework rate", v: `${me.rework}%`, p: me.rework * 5 },
            ].map((r) => (
              <div key={r.l}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="text-slate-600">{r.l}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{r.v}</span>
                </div>
                <Progress value={r.p} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Worker load today"
            subtitle="Tasks completed vs assigned"
            action={<Legend items={[{ label: "Completed", color: SERIES[2] }, { label: "Assigned", color: "#cbd5e1" }]} />}
          />
          <div className="px-3 pb-4">
            <Bars
              data={workers.map((w) => ({ name: w.name.split(" ")[0], completed: w.completed, assigned: w.tasksToday }))}
              xKey="name"
              series={[
                { key: "completed", label: "Completed", color: SERIES[2] },
                { key: "assigned", label: "Assigned", color: "#cbd5e1" },
              ]}
              height={240}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="15-day clock" subtitle="Oldest first — penalty after day 15" icon={Clock} />
          <ul className="space-y-3 px-5 pb-5">
            {clock.map((c) => (
              <li key={c.id}>
                <Link href={`/complaints/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                  <Avatar name={c.workers?.[0] ?? me.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-800">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.workers?.[0] ?? "Not distributed yet"}</p>
                  </div>
                  <span className={cn("flex items-center gap-1 text-xs font-bold whitespace-nowrap", c.daysOpen > PENALTY_AFTER_DAYS ? "text-rose-600" : c.daysOpen >= 12 ? "text-amber-600" : "text-slate-600")}>
                    <Gavel className="size-3.5" />
                    Day {c.daysOpen}/{PENALTY_AFTER_DAYS}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
