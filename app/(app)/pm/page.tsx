import Link from "next/link";
import { ClipboardList, Gavel, Radar, Timer, Truck, Users } from "lucide-react";
import { COMPLAINTS, PMS, VENDORS, WORKERS, inr, penaltyOf } from "@/lib/data";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { WORKER_STATUS } from "@/lib/worker-status";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Card, CardHeader, LinkButton, PageHeader, PriorityBadge, Progress, StatCard, StatusBadge } from "@/components/ui";
import { LiveMap, MapLegend } from "@/components/live-map";

const ME = PMS[0];

export default function PMDashboard() {
  const vendors = VENDORS.filter((v) => ME.vendors.includes(v.name));
  const mine = COMPLAINTS.filter((c) => ME.vendors.includes(c.vendor ?? ""));
  const open = mine.filter((c) => c.status !== "closed" && c.status !== "rejected");
  const penalties = mine.map(penaltyOf);
  const exposure = penalties.reduce((a, p) => a + p.amount, 0);
  const late = penalties.filter((p) => p.state === "Accruing");
  const workers = WORKERS.filter((w) => ME.vendors.includes(w.vendor));

  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel"
        title="My vendors"
        description="You are responsible for the vendors below. Every complaint reaches you at the same time as the vendor — follow it, chase delays and watch the penalty clock."
        actions={
          <>
            <LinkButton href="/pm/monitoring" variant="secondary">
              <Radar /> Live monitoring
            </LinkButton>
            <LinkButton href="/pm/vendors">
              <Truck /> Manage vendors
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vendors I manage" value={vendors.length} icon={Truck} tone="navy" hint={vendors.map((v) => v.name.split(" ")[0]).join(" · ")} />
        <StatCard label="Open complaints" value={open.length} icon={ClipboardList} tone="sky" hint="across my vendors" />
        <StatCard label="Past 15 days" value={late.length} icon={Timer} tone="rose" hint="penalty accruing" />
        <StatCard label="Penalty exposure" value={inr(exposure)} icon={Gavel} tone="amber" hint="levied + accruing" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Vendor scorecard" subtitle="Performance of the vendors you are responsible for" action={<Link href="/pm/vendors" className="text-[13px] font-semibold text-brand-600">Details</Link>} />
          <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
            {vendors.map((v) => {
              const vp = mine.filter((c) => c.vendor === v.name).map(penaltyOf);
              return (
                <div key={v.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={v.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{v.name}</p>
                      <p className="text-xs text-slate-500">{v.contact} · {v.workers} workers</p>
                    </div>
                    <Badge className={v.sla >= 90 ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-rose-50 text-rose-700 ring-rose-600/15"}>SLA {v.sla}%</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { l: "Open", v: vp.filter((p) => p.complaint.status !== "closed" && p.complaint.status !== "rejected").length },
                      { l: "Late", v: vp.filter((p) => p.overdueDays > 0).length },
                      { l: "Penalty", v: inr(vp.reduce((a, p) => a + p.amount, 0)) },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg bg-slate-50 py-2">
                        <p className="text-sm font-bold text-slate-900">{x.v}</p>
                        <p className="text-[10px] text-slate-500">{x.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Needs a nudge" subtitle="Oldest open complaints" />
          <ul className="divide-y divide-slate-100">
            {[...open].sort((a, b) => b.daysOpen - a.daysOpen).slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/complaints/${c.id}`} className="block px-5 py-3.5 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 truncate text-[13.5px] font-semibold text-slate-900">{c.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <PriorityBadge priority={c.priority} />
                    <span className={cn("flex items-center gap-1 text-xs font-semibold", c.daysOpen > PENALTY_AFTER_DAYS ? "text-rose-600" : "text-slate-500")}>
                      <Timer className="size-3" /> Day {c.daysOpen}/{PENALTY_AFTER_DAYS}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Field map" subtitle="Workers of my vendors & open complaints" action={<LinkButton href="/pm/monitoring" size="sm" variant="secondary">Expand</LinkButton>} />
          <div className="px-5 pb-5">
            <LiveMap
              className="h-72"
              points={[
                ...workers.map((w) => ({ id: w.id, x: w.x, y: w.y, kind: "worker" as const, tone: WORKER_STATUS[w.status].tone, label: w.name, sub: `${w.status}${w.task ? ` · ${w.task}` : ""}`, live: w.status !== "Offline" })),
                ...open.map((c, i) => ({ id: c.id, x: 20 + i * 15, y: 25 + (i % 3) * 20, kind: "complaint" as const, tone: c.daysOpen > PENALTY_AFTER_DAYS ? ("red" as const) : ("violet" as const), label: c.id, sub: c.title })),
              ]}
            />
            <div className="mt-3">
              <MapLegend items={[{ label: "On task", tone: "amber" }, { label: "Travelling", tone: "blue" }, { label: "Available", tone: "green" }, { label: "Offline", tone: "slate" }, { label: "Complaint", tone: "violet" }, { label: "Past 15 days", tone: "red" }]} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Workers in the field" icon={Users} />
          <div className="space-y-3 px-5 pb-5">
            {workers.slice(0, 5).map((w) => (
              <div key={w.id} className="flex items-center gap-3">
                <Avatar name={w.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-800">{w.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{w.vendor}</p>
                  <Progress value={(w.completed / w.tasksToday) * 100} tone="bg-emerald-500" className="mt-1" />
                </div>
                <Badge className={WORKER_STATUS[w.status].badge} dot={WORKER_STATUS[w.status].dot}>{w.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
