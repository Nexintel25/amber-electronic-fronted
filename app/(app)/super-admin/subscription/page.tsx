import {
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  Download,
  GraduationCap,
  Headset,
  Receipt,
  Rocket,
  Server,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { SITES, USER_CAP_PER_SITE } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, NoData, NoDataRow, PageHeader, Progress, td, th } from "@/components/ui";

const included = [
  { icon: Wrench, t: "Development", d: "Web dashboard + worker, PM & vendor mobile apps" },
  { icon: Rocket, t: "Deployment", d: "AWS cloud hosting, S3 storage, Firebase" },
  { icon: GraduationCap, t: "Training", d: "Role-wise onboarding for all users" },
  { icon: Headset, t: "Support", d: "1-year hands-on support included" },
];

const customizations: { id: string; title: string; status: string; note: string; date: string }[] = [];
const invoices: { id: string; d: string; date: string; s: string }[] = [];

export default function SubscriptionPage() {
  const extra = SITES.reduce((a, s) => a + Math.max(0, s.users - USER_CAP_PER_SITE), 0);

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Subscription & billing"
        description="Your plan, renewal schedule, user limits and customization requests with Nexintel Synergy."
        actions={
          <Button variant="secondary">
            <Headset /> Contact account manager
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">Renewal invoice date: —</p>
          <p className="text-amber-800">
            Annual renewal invoices are raised 30 days prior to the renewal date (—). Non-renewal will result in suspension of cloud services and platform access.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-navy-950 p-6 text-white">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge className="bg-brand-500 text-white ring-brand-400/30">
                  <Sparkles className="size-3" /> —
                </Badge>
                <p className="mt-3 text-2xl font-bold">—</p>
                <p className="text-sm text-slate-300">Complaint Management & Monitoring Platform</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Payment terms</p>
                <p className="font-semibold">—</p>
              </div>
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Start date", "—"],
                ["Renewal date", "—"],
                ["Invoice date", "—"],
                ["Days to renewal", "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[11px] text-slate-400">{l}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="relative mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand-500" style={{ width: "0%" }} />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">— days used</p>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {included.map((i) => (
              <div key={i.t} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <i.icon className="size-4" />
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-900">{i.t} <BadgeCheck className="size-3.5 text-emerald-600" /></p>
                  <p className="text-xs text-slate-500">{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="User limits" subtitle="Concurrent users per site" icon={Users} />
          <div className="space-y-3.5 px-5 pb-5">
            {SITES.length === 0 && <NoData />}
            {SITES.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-slate-600">{s.name}</span>
                  <span className={cn("font-semibold tabular-nums", s.users >= USER_CAP_PER_SITE ? "text-rose-600" : "text-slate-900")}>{s.users}/{USER_CAP_PER_SITE}</span>
                </div>
                <Progress value={(s.users / USER_CAP_PER_SITE) * 100} tone={s.users >= USER_CAP_PER_SITE ? "bg-rose-500" : "bg-brand-500"} />
              </div>
            ))}
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Additional users beyond the per-site cap are chargeable separately. Currently <b className="text-slate-900">{SITES.length ? extra : "—"}</b> additional users billed.
            </div>
            <Button variant="secondary" className="w-full">Request more seats</Button>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Customization requests" subtitle="Customizations beyond the agreed scope are subject to additional charges" icon={Wrench} action={<Button size="sm">New request</Button>} />
          <ul className="divide-y divide-slate-100">
            {customizations.length === 0 && <li><NoData /></li>}
            {customizations.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-900"><span className="font-mono text-xs text-slate-400">{c.id}</span> · {c.title}</p>
                  <p className="text-xs text-slate-500">{c.note} · {c.date}</p>
                </div>
                <Badge
                  className={
                    c.status === "Delivered" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : c.status === "Quoted" ? "bg-brand-50 text-brand-700 ring-brand-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/15"
                  }
                >
                  {c.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Cloud services" icon={Server} />
          <ul className="space-y-2.5 px-5 pb-5 text-[13px]">
            {["AWS hosting (Node.js API)", "MySQL database", "AWS S3 media storage", "Firebase push notifications", "Android & iOS app distribution"].map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className="text-slate-700">{s}</span>
                <span className="text-xs font-semibold text-slate-400">—</span>
              </li>
            ))}
            <li className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <CalendarClock className="size-4 shrink-0" /> Access continues uninterrupted on timely renewal.
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Invoices" icon={Receipt} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Invoice</th>
                <th className={th}>Description</th>
                <th className={th}>Date</th>
                <th className={th}>Status</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 && <NoDataRow cols={5} />}
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/60">
                  <td className={cn(td, "font-mono text-xs font-semibold")}>{i.id}</td>
                  <td className={td}>{i.d}</td>
                  <td className={td}>{i.date}</td>
                  <td className={td}>
                    <Badge className={i.s === "Paid" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-amber-50 text-amber-700 ring-amber-600/20"}>{i.s}</Badge>
                  </td>
                  <td className={cn(td, "text-right")}>
                    {i.s === "Paid" && (
                      <Button variant="ghost" size="sm" aria-label="Download">
                        <Download />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
