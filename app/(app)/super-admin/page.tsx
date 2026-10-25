"use client";

import Link from "next/link";
import { Building, ClipboardList, HardHat, ScrollText, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, CardHeader, EmptyState, LinkButton, PageHeader, StatCard } from "@/components/ui";

export default function SuperAdminOverview() {
  const dash = useApi(() => api.getAdminDashboard());
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
          <EmptyState icon={ScrollText} title="No audit events" text="The audit-log API is not connected yet." />
        </Card>

        <Card>
          <CardHeader title="Users by role" />
          <EmptyState icon={Users} title="No data" text="The users API is not connected yet." />
        </Card>
      </div>
    </>
  );
}
