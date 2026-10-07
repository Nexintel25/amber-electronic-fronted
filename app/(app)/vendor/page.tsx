import Link from "next/link";
import { BadgeCheck, Clock, Inbox, Star, Timer, TriangleAlert, UserCog } from "lucide-react";
import { COMPLAINTS, PMS, VENDORS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar, Card, CardHeader, LinkButton, PageHeader, PriorityBadge, Progress, StatCard, StatusBadge } from "@/components/ui";
import { Bars, Legend, SERIES } from "@/components/charts";

const me = VENDORS[0];

export default function VendorDashboard() {
  const queue = COMPLAINTS.filter((c) => c.status === "new" || c.status === "vendor_review");
  const closure = COMPLAINTS.filter((c) => c.status === "completed");
  const atRisk = COMPLAINTS.filter((c) => c.slaRisk);

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel · PowerGrid Services"
        title="Vendor dashboard"
        description="Review incoming complaints, accept or reject them, and assign Project Managers with priority and deadline."
        actions={
          <LinkButton href="/vendor/queue">
            <Inbox /> Open review queue
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting review" value={queue.length} icon={Inbox} tone="violet" hint="new complaints" />
        <StatCard label="Assigned to PMs" value={PMS.reduce((a, p) => a + p.active, 0)} icon={UserCog} tone="navy" hint="active across 4 PMs" />
        <StatCard label="Pending final closure" value={closure.length} icon={BadgeCheck} tone="emerald" hint="verified by PM" />
        <StatCard label="SLA breach risk" value={atRisk.length} icon={TriangleAlert} tone="rose" delta="1" deltaGood={false} hint="since yesterday" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Review queue"
            subtitle="Accept, reject or assign — oldest first"
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
            title="Project Manager workload"
            subtitle="Active complaints vs capacity"
            action={<Legend items={[{ label: "Active", color: SERIES[0] }, { label: "Capacity", color: "#cbd5e1" }]} />}
          />
          <div className="px-3 pb-4">
            <Bars
              data={PMS.map((p) => ({ name: p.name, active: p.active, capacity: p.capacity }))}
              xKey="name"
              series={[
                { key: "active", label: "Active", color: SERIES[0] },
                { key: "capacity", label: "Capacity", color: "#cbd5e1" },
              ]}
              height={240}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Deadlines approaching" icon={Clock} />
          <ul className="space-y-3 px-5 pb-5">
            {COMPLAINTS.filter((c) => c.slaLeft && !["closed", "completed"].includes(c.status))
              .slice(0, 5)
              .map((c) => (
                <li key={c.id}>
                  <Link href={`/complaints/${c.id}`} className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-slate-50">
                    <Avatar name={c.pm ?? "PM"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.pm}</p>
                    </div>
                    <span className={cn("flex items-center gap-1 text-xs font-bold whitespace-nowrap", c.slaRisk ? "text-rose-600" : "text-slate-600")}>
                      <Timer className="size-3.5" />
                      {c.slaLeft}
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
