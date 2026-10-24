"use client";

import Link from "next/link";
import { BadgeCheck, Clock, Gavel, HardHat, Inbox, Loader2, TriangleAlert } from "lucide-react";
import { inr, penaltyOf } from "@/lib/complaint";
import { api, toComplaint } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { workerView } from "@/lib/vendor-workers";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, CardHeader, EmptyState, LinkButton, PageHeader, PriorityBadge, StatCard, StatusBadge } from "@/components/ui";
import { Bars, SERIES } from "@/components/charts";

export default function VendorDashboard() {
  const session = useSession();
  // The API scopes complaints to the signed-in vendor.
  const complaints = useApi(async () => (await api.getComplaints({ limit: 200 })).data.map(toComplaint));
  const workersApi = useApi(async () => (session?.user.vendor_id ? (await api.getVendorWorkers(session.user.vendor_id)).map((w) => ({ ...workerView(w), open: Number((w as { open_jobs?: number }).open_jobs ?? 0) })) : []), [session?.user.vendor_id]);

  if (complaints.loading) return <div className="grid place-items-center py-32 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>;
  if (complaints.error || !complaints.data)
    return <EmptyState icon={TriangleAlert} title="Could not load the dashboard" text={complaints.error ?? "No data"} action={<Button onClick={complaints.reload}>Try again</Button>} />;

  const mineAll = complaints.data;
  const queue = mineAll.filter((c) => c.status === "new" || c.status === "vendor_review");
  const field = mineAll.filter((c) => ["worker_assigned", "in_progress", "rework"].includes(c.status));
  const verify = mineAll.filter((c) => c.status === "pending_verification" || c.status === "issue_raised");
  const penalty = mineAll.map(penaltyOf).reduce((a, p) => a + p.amount, 0);
  const clock = mineAll.filter((c) => c.status !== "closed" && c.status !== "rejected").sort((a, b) => b.daysOpen - a.daysOpen).slice(0, 5);
  const workers = workersApi.data ?? [];
  const company = mineAll.find((c) => c.vendor)?.vendor ?? session?.user.name ?? "Vendor";

  return (
    <>
      <PageHeader
        eyebrow={`Vendor Panel · ${company}`}
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
            {queue.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-400">No complaints waiting for review.</li>}
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

        <Card className="xl:col-span-2">
          <CardHeader
            title="Worker load"
            subtitle="Open jobs per worker"
          />
          <div className="px-3 pb-4">
            {workers.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-slate-400">No workers yet.</p>
            ) : (
              <Bars data={workers.map((w) => ({ name: w.name.split(" ")[0], open: w.open }))} xKey="name" series={[{ key: "open", label: "Open jobs", color: SERIES[0] }]} height={240} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="15-day clock" subtitle="Oldest first — penalty after day 15" icon={Clock} />
          <ul className="space-y-3 px-5 pb-5">
            {clock.map((c) => (
              <li key={c.id}>
                <Link href={`/complaints/${c.ref}`} className="-mx-2 flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                  <Avatar name={c.workers?.[0] ?? company} size="sm" />
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
