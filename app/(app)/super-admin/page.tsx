import Link from "next/link";
import {
  Bell,
  Building,
  Cloud,
  CreditCard,
  Database,
  KeyRound,
  Lock,
  Server,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AUDIT_LOGS, SITES, USER_CAP_PER_SITE, USERS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Card, CardHeader, LinkButton, PageHeader, Progress, StatCard } from "@/components/ui";

const services = [
  { name: "API Server", tech: "Node.js · AWS", icon: Server, uptime: "99.98%", latency: "84 ms" },
  { name: "Database", tech: "MySQL (RDS)", icon: Database, uptime: "99.99%", latency: "6 ms" },
  { name: "Photo & Media Storage", tech: "AWS S3", icon: Cloud, uptime: "100%", latency: "112 ms" },
  { name: "Push Notifications", tech: "Firebase Cloud Messaging", icon: Bell, uptime: "99.95%", latency: "240 ms" },
  { name: "Authentication", tech: "JWT · encrypted APIs", icon: Lock, uptime: "100%", latency: "18 ms" },
];

const sevTone: Record<string, string> = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
};

export default function SuperAdminOverview() {
  const totalUsers = SITES.reduce((a, s) => a + s.users, 0);
  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Platform control center"
        description="Manage users and roles, platform configuration, sites, subscription and the complete audit trail."
        actions={
          <>
            <LinkButton href="/super-admin/settings" variant="secondary">
              <Settings /> Configurations
            </LinkButton>
            <LinkButton href="/super-admin/users">
              <UserPlus /> Add user
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} icon={Users} tone="navy" hint={`${SITES.length} sites · cap ${USER_CAP_PER_SITE}/site`} />
        <StatCard label="Roles" value={6} icon={KeyRound} tone="violet" hint="role-based access control" />
        <StatCard label="Active sites" value={SITES.length} icon={Building} tone="brand" hint="NADT" />
        <StatCard label="Security events (24h)" value={3} icon={ShieldCheck} tone="rose" hint="1 account locked" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="System health" subtitle="All services operational" action={<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">● Operational</span>} />
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.name} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <s.icon className="size-4" />
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Healthy
                  </span>
                </div>
                <p className="mt-3 text-[13.5px] font-semibold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">{s.tech}</p>
                <div className="mt-3 flex justify-between text-[11px] text-slate-500">
                  <span>Uptime <b className="text-slate-800">{s.uptime}</b></span>
                  <span>p95 <b className="text-slate-800">{s.latency}</b></span>
                </div>
                {/* 30-day uptime bars */}
                <div className="mt-2 flex gap-[2px]">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className={cn("h-4 flex-1 rounded-[2px]", (i * 7 + s.name.length) % 29 === 0 ? "bg-amber-400" : "bg-emerald-400")} />
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-slate-200 p-4">
              <p className="text-[13px] font-semibold text-slate-900">Storage</p>
              <p className="text-xs text-slate-500">AWS S3 · photos & media</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">38.2 <span className="text-sm font-medium text-slate-500">GB</span></p>
              <Progress value={38} className="mt-2" />
              <p className="mt-1.5 text-[11px] text-slate-500">4,812 photos · 214 videos</p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-navy-900 to-navy-950 p-5 text-white">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300 uppercase"><CreditCard className="size-3.5" /> Subscription</p>
            <p className="mt-2 text-xl font-bold">Year 1 Package</p>
            <p className="text-sm text-slate-300">Development · Deployment · Training · Support</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-slate-400">Renews on</p>
                <p className="font-semibold">15 Jan 2027</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Renewal invoice</p>
                <p className="font-semibold">16 Dec 2026</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-[13px] text-slate-600">Invoice is raised 30 days prior to renewal. Non-renewal results in suspension of cloud services and platform access.</p>
            <LinkButton href="/super-admin/subscription" variant="secondary" className="mt-4 w-full">Manage subscription</LinkButton>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Recent audit events" action={<Link href="/super-admin/audit-logs" className="text-[13px] font-semibold text-brand-600">View all</Link>} />
          <ul className="divide-y divide-slate-100">
            {AUDIT_LOGS.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", sevTone[a.severity])} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-slate-800">
                    <b className="font-semibold">{a.user}</b> <span className="text-slate-500">({a.role})</span> — {a.action}
                  </p>
                  <p className="text-xs text-slate-500">{a.entity} · {a.ip} · {a.device}</p>
                </div>
                <span className="text-[11px] whitespace-nowrap text-slate-400">{a.time.split(", ")[1]}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Users by role" />
          <div className="space-y-3 px-5 pb-5">
            {["Super Admin", "Admin", "Complaint Creator", "Vendor", "Project Manager", "Worker"].map((r) => {
              const n = { "Super Admin": 1, Admin: 3, "Complaint Creator": 14, Vendor: 8, "Project Manager": 7, Worker: 36 }[r]!;
              return (
                <div key={r}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="text-slate-600">{r}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{n}</span>
                  </div>
                  <Progress value={(n / 36) * 100} tone="bg-navy-700" />
                </div>
              );
            })}
            <p className="pt-1 text-[11px] text-slate-500">Showing {USERS.length} recent of 69 users</p>
          </div>
        </Card>
      </div>
    </>
  );
}
