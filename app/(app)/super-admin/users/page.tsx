"use client";

import { useMemo, useState } from "react";
import { Ellipsis, KeyRound, Lock, Search, TriangleAlert, UserPlus } from "lucide-react";
import { USERS } from "@/lib/data";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, Input, NoData, NoDataRow, PageHeader, Progress, Select, td, th } from "@/components/ui";
import { useToast } from "@/components/interactive";
import { CreateSiteModal } from "@/components/create-site-modal";
import { CreateUserModal } from "@/components/create-user-modal";
import { CreateVendorModal } from "@/components/create-vendor-modal";
import { Modal } from "@/components/interactive";
import type { UserRoleLabel } from "@/lib/roles";

const ROLE_OPTIONS: UserRoleLabel[] = ["Super Admin", "Admin", "Project Manager", "Vendor", "Worker", "Complaint Creator"];

const roleTone: Record<string, string> = {
  "Super Admin": "bg-navy-950 text-white ring-navy-900/20",
  Admin: "bg-navy-100 text-navy-800 ring-navy-600/15",
  "Complaint Creator": "bg-sky-50 text-sky-700 ring-sky-600/15",
  Vendor: "bg-violet-50 text-violet-700 ring-violet-600/15",
  "Project Manager": "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  Worker: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [site, setSite] = useState("");
  const [kind, setKind] = useState<"choose" | "building" | "admin" | "vendor" | null>(null);
  const toast = useToast();
  const dash = useApi(() => api.getAdminDashboard());
  const buildings = useApi(() => api.getBuildings());
  const SITES = dash.data?.sites ?? [];

  const rows = useMemo(
    () =>
      USERS.filter(
        (u) =>
          (!role || u.role === role) &&
          (!site || u.site === site) &&
          (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q.toLowerCase())),
      ),
    [q, role, site],
  );

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="User management"
        description="The Super Admin creates every user. Chain of command: Super Admin → Admin → Project Manager → Vendor → Worker — each level then creates the level below it."
        actions={
          <Button onClick={() => setKind("choose")}>
            <UserPlus /> Add user
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {SITES.length === 0 && <Card className="sm:col-span-2 lg:col-span-5"><NoData /></Card>}
        {SITES.map((s) => {
          const cap = s.max_concurrent_users;
          const full = cap > 0 && s.concurrent_users >= cap;
          return (
            <Card key={s.building_id} className={cn("p-4", full && "ring-2 ring-rose-200")}>
              <div className="flex items-center justify-between">
                <p className="truncate text-[13px] font-semibold text-slate-800">{s.building_name}</p>
                {full && <TriangleAlert className="size-4 text-rose-500" />}
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {s.concurrent_users}
                <span className="text-sm font-medium text-slate-400">/{cap}</span>
              </p>
              <Progress value={cap ? (s.concurrent_users / cap) * 100 : 0} tone={full ? "bg-rose-500" : "bg-emerald-500"} className="mt-2" />
              <p className={cn("mt-1.5 text-[11px]", full ? "font-semibold text-rose-600" : "text-slate-500")}>{full ? "Cap reached — extra users chargeable" : `${Math.max(0, cap - s.concurrent_users)} seats left`}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="pl-9" />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-48">
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Select value={site} onChange={(e) => setSite(e.target.value)} className="w-56">
            <option value="">All sites</option>
            <option>All Sites</option>
            {buildings.data?.map((s) => (
              <option key={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Role</th>
                <th className={th}>Reports to</th>
                <th className={th}>Site</th>
                <th className={th}>Organisation</th>
                <th className={th}>Status</th>
                <th className={th}>Last active</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && <NoDataRow cols={8} noApi />}
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={td}><Badge className={roleTone[u.role]}>{u.role}</Badge></td>
                  <td className={td}>{u.reportsTo}</td>
                  <td className={td}>{u.site}</td>
                  <td className={td}>{u.org}</td>
                  <td className={td}>
                    <Badge
                      className={u.status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : u.status === "Locked" ? "bg-rose-50 text-rose-700 ring-rose-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"}
                      dot={u.status === "Active" ? "bg-emerald-500" : u.status === "Locked" ? "bg-rose-500" : "bg-slate-400"}
                    >
                      {u.status === "Locked" && <Lock className="size-3" />}
                      {u.status}
                    </Badge>
                  </td>
                  <td className={td}>{u.lastActive}</td>
                  <td className={cn(td, "text-right")}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" aria-label="Reset password" onClick={() => toast.show(`Password reset link sent to ${u.email}`)}>
                        <KeyRound />
                      </Button>
                      <Button variant="ghost" size="sm" aria-label="More">
                        <Ellipsis />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Showing {rows.length} users
        </div>
      </Card>

      <Modal open={kind === "choose"} onClose={() => setKind(null)} title="Add user" description="What type of user do you want to create?" size="sm">
        <div className="space-y-2">
          {([
            ["building", "Building", "A site together with its sign-in user"],
            ["admin", "Admin & other roles", "Admin, Project Manager, Worker, Complaint Creator"],
            ["vendor", "Vendor", "A vendor company with its sign-in user and sites"],
          ] as const).map(([k, t, d]) => (
            <button key={k} onClick={() => setKind(k)} className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/30">
              <p className="text-sm font-semibold text-slate-900">{t}</p>
              <p className="text-xs text-slate-500">{d}</p>
            </button>
          ))}
        </div>
      </Modal>
      <CreateSiteModal open={kind === "building"} onClose={() => setKind(null)} onCreated={buildings.reload} />
      <CreateUserModal open={kind === "admin"} onClose={() => setKind(null)} allowedRoles={ROLE_OPTIONS.filter((r) => r !== "Super Admin" && r !== "Vendor")} defaultRole="Admin" />
      <CreateVendorModal open={kind === "vendor"} onClose={() => setKind(null)} />
      {toast.node}
    </>
  );
}
