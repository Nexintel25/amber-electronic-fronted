"use client";

import Link from "next/link";
import { Building, ClipboardList, HardHat, ScrollText, UserPlus, Users } from "lucide-react";
import { api, pick, rowsOf, text, timeText } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Avatar, Card, CardHeader, EmptyState, LinkButton, ListSkeleton, PageHeader, StatCard } from "@/components/ui";

export default function SuperAdminOverview() {
  const dash = useApi(() => api.getAdminDashboard());
  const audit = useApi(() => api.getAuditLogs({ page: 1, limit: 6 }));
  const events = rowsOf(audit.data?.data);
  const k = dash.data?.kpis;
  const sites = dash.data?.sites ?? [];
  const dash_ = (v: number | undefined) => (dash.loading ? "…" : (v ?? "—"));
  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Platform control center"
        description="Manage users and roles, platform configuration, sites, subscription and the complete audit trail."
        actions={
          <>
            <LinkButton href="/super-admin/users">
              <UserPlus /> Add user
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total complaints" value={dash_(k?.total_complaints)} icon={ClipboardList} tone="navy" hint={k ? `${k.raised_this_month} raised this month` : undefined} />
        <StatCard label="Open now" value={dash_(k?.open_now)} icon={Users} tone="violet" hint="across all sites" />
        <StatCard label="Active sites" value={dash_(dash.data ? sites.length : undefined)} icon={Building} tone="brand" hint={sites.map((x) => x.building_name).slice(0, 2).join(" · ")} />
        <StatCard label="Workers" value={dash_(k?.workers_total)} icon={HardHat} tone="rose" hint={k ? `${k.workers_online} online` : undefined} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent audit events" action={<Link href="/super-admin/audit-logs" className="text-[13px] font-semibold text-brand-600">View all</Link>} />
          {audit.loading && <ListSkeleton rows={4} className="rounded-none shadow-none ring-0" />}
          {audit.error && <EmptyState icon={ScrollText} title="Could not load audit events" text={audit.error} />}
          {audit.data && events.length === 0 && <EmptyState icon={ScrollText} title="No audit events yet" text="Actions across the platform will appear here." />}
          <ul className="divide-y divide-slate-100 px-5 pb-3">
            {events.map((e, i) => {
              const actor = text(pick(e, "actor_name"), "System");
              return (
                <li key={i} className="flex items-center gap-3 py-3">
                  <Avatar name={actor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">
                      <b className="font-semibold">{actor}</b> · {text(pick(e, "action")).replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="truncate text-xs text-slate-500">{text(pick(e, "summary", "entity_label"), "")}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-slate-400">{timeText(pick(e, "event_time"))}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Users by role" />
          <EmptyState icon={Users} title="API not available" text="No users API is available yet." />
        </Card>
      </div>
    </>
  );
}
