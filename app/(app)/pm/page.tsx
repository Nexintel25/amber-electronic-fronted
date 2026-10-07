import Link from "next/link";
import { ClipboardList, Hammer, Radar, ShieldCheck, Timer, UserPlus, Users } from "lucide-react";
import { COMPLAINTS, TEAMS, WORKERS } from "@/lib/data";
import { WORKER_STATUS } from "@/lib/worker-status";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Card, CardHeader, LinkButton, PageHeader, PriorityBadge, Progress, StatCard, StatusBadge } from "@/components/ui";
import { LiveMap, MapLegend } from "@/components/live-map";

export default function PMDashboard() {
  const mine = COMPLAINTS.filter((c) => c.pm === "Arjun Sharma");
  const toAssign = COMPLAINTS.filter((c) => c.status === "assigned_pm" || c.status === "rework");
  const field = WORKERS.filter((w) => w.site === "Noida Plant" || w.team === "Alpha" || w.team === "Bravo");

  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel"
        title="Field operations"
        description="Allocate workers and teams, monitor field progress live, and verify completed work."
        actions={
          <>
            <LinkButton href="/pm/monitoring" variant="secondary">
              <Radar /> Live monitoring
            </LinkButton>
            <LinkButton href="/pm/assignments">
              <UserPlus /> Assign work
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned to me" value={mine.length} icon={ClipboardList} tone="navy" hint="active complaints" />
        <StatCard label="Awaiting allocation" value={toAssign.length} icon={UserPlus} tone="violet" hint="need worker / team" />
        <StatCard label="Active in field" value={field.filter((w) => w.status === "On Task").length} icon={Hammer} tone="amber" hint={`of ${field.length} workers`} />
        <StatCard label="Pending verification" value={COMPLAINTS.filter((c) => c.status === "pending_verification").length} icon={ShieldCheck} tone="brand" hint="review photos" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Field map — Noida Plant"
            subtitle="Live worker positions & open complaints"
            action={<LinkButton href="/pm/monitoring" size="sm" variant="secondary">Expand</LinkButton>}
          />
          <div className="px-5 pb-5">
            <LiveMap
              className="h-80"
              points={[
                ...field.map((w) => ({ id: w.id, x: w.x, y: w.y, kind: "worker" as const, tone: WORKER_STATUS[w.status].tone, label: w.name, sub: `${w.status}${w.task ? ` · ${w.task}` : ""}`, live: w.status !== "Offline" })),
                ...mine.filter((c) => c.status !== "closed").map((c, i) => ({ id: c.id, x: 20 + i * 15, y: 25 + (i % 3) * 20, kind: "complaint" as const, tone: c.slaRisk ? ("red" as const) : ("violet" as const), label: c.id, sub: c.title })),
              ]}
            />
            <div className="mt-3">
              <MapLegend items={[{ label: "On task", tone: "amber" }, { label: "Travelling", tone: "blue" }, { label: "Available", tone: "green" }, { label: "Offline", tone: "slate" }, { label: "Complaint", tone: "violet" }, { label: "SLA risk", tone: "red" }]} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Needs your action" subtitle="Allocation & verification" />
          <ul className="divide-y divide-slate-100">
            {[...toAssign, ...COMPLAINTS.filter((c) => c.status === "pending_verification")].map((c) => (
              <li key={c.id}>
                <Link href={c.status === "pending_verification" ? "/pm/verification" : "/pm/assignments"} className="block px-5 py-3.5 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 truncate text-[13.5px] font-semibold text-slate-900">{c.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <PriorityBadge priority={c.priority} />
                    {c.slaLeft && (
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", c.slaRisk ? "text-rose-600" : "text-slate-500")}>
                        <Timer className="size-3" /> {c.slaLeft}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Workers today" icon={Users} action={<Link href="/pm/teams" className="text-[13px] font-semibold text-brand-600">All teams</Link>} />
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
            {field.slice(0, 6).map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <Avatar name={w.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{w.name}</p>
                  <p className="truncate text-xs text-slate-500">{w.task ? `${w.task} · ` : ""}{w.skill}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={(w.completed / w.tasksToday) * 100} tone="bg-emerald-500" />
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">{w.completed}/{w.tasksToday}</span>
                  </div>
                </div>
                <Badge className={WORKER_STATUS[w.status].badge} dot={WORKER_STATUS[w.status].dot}>{w.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Team utilization" />
          <div className="space-y-4 px-5 pb-5">
            {TEAMS.map((t) => (
              <div key={t.id}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="font-semibold text-slate-800">Team {t.name}</span>
                  <span className="text-slate-500 tabular-nums">{t.utilization}%</span>
                </div>
                <Progress value={t.utilization} tone={t.utilization > 85 ? "bg-rose-500" : "bg-brand-500"} />
                <p className="mt-1 text-[11px] text-slate-500">{t.focus} · {t.open} open</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
