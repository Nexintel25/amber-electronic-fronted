"use client";

import Link from "next/link";
import { ClipboardList, Gavel, Loader2, Radar, Timer, TriangleAlert, Truck } from "lucide-react";
import { api, toComplaint } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, CardHeader, EmptyState, LinkButton, PageHeader, PriorityBadge, StatCard, StatusBadge } from "@/components/ui";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function PMDashboard() {
  const complaints = useApi(async () => (await api.getComplaints({ limit: 200 })).data.map(toComplaint));
  // Extra KPIs from the PM dashboard endpoint, if the signed-in user is allowed to see it.
  const dash = useApi(() => api.getPmDashboard().catch(() => null));

  if (complaints.loading) return <div className="grid place-items-center py-32 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>;
  if (complaints.error || !complaints.data)
    return <EmptyState icon={TriangleAlert} title="Could not load your dashboard" text={complaints.error ?? "No data"} action={<Button onClick={complaints.reload}>Try again</Button>} />;

  const all = complaints.data;
  const open = all.filter((c) => c.status !== "closed" && c.status !== "rejected");
  const late = open.filter((c) => c.daysOpen > PENALTY_AFTER_DAYS);
  const vendors = [...new Set(all.map((c) => c.vendor).filter((v): v is string => !!v))];
  const k = dash.data?.kpis;

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
        <StatCard label="Vendors I manage" value={k?.vendors_managed ?? vendors.length} icon={Truck} tone="navy" hint={k?.vendor_names || vendors.slice(0, 3).join(" · ")} />
        <StatCard label="Open complaints" value={k?.open_complaints ?? open.length} icon={ClipboardList} tone="sky" hint="across my vendors" />
        <StatCard label="Overdue" value={k?.overdue_count ?? late.length} icon={Timer} tone="rose" hint="past deadline" />
        <StatCard label="Penalty exposure" value={k ? inr(k.penalty_exposure) : "—"} icon={Gavel} tone="amber" hint={k ? `${inr(k.penalty_levied)} levied · ${inr(k.penalty_accruing)} accruing` : undefined} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Vendor load" subtitle="Complaints per vendor" action={<Link href="/pm/vendors" className="text-[13px] font-semibold text-brand-600">Details</Link>} />
          <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
            {vendors.length === 0 && <p className="text-sm text-slate-400">No complaints are assigned to a vendor yet.</p>}
            {vendors.map((v) => {
              const mine = all.filter((c) => c.vendor === v);
              const o = mine.filter((c) => c.status !== "closed" && c.status !== "rejected");
              return (
                <div key={v} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={v} />
                    <p className="min-w-0 flex-1 truncate font-semibold text-slate-900">{v}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      { l: "Total", v: mine.length },
                      { l: "Open", v: o.length },
                      { l: "Late", v: o.filter((c) => c.daysOpen > PENALTY_AFTER_DAYS).length },
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
            {open.length === 0 && <li className="px-5 py-6 text-center text-sm text-slate-400">Nothing open right now.</li>}
            {[...open].sort((a, b) => b.daysOpen - a.daysOpen).slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/complaints/${c.ref}`} className="block px-5 py-3.5 hover:bg-slate-50">
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
      </div>
    </>
  );
}
