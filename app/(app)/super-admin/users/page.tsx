"use client";

import { useEffect, useState } from "react";
import { Ellipsis, History, KeyRound, Lock, Search, Truck, TriangleAlert, UserPlus } from "lucide-react";
import { API_ROLE_BY_LABEL, api, pick, roleKeyFromApi, rowsOf, text, timeText, type Row } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, EmptyState, Input, ListSkeleton, NoDataRow, PageHeader, Select, td, th } from "@/components/ui";
import { Pager } from "@/components/pager";
import { AddOrgBuildingsModal } from "@/components/add-org-buildings-modal";
import { AssignVendorsModal, managedVendorNames } from "@/components/assign-vendors-modal";
import { CreateClientOrgModal } from "@/components/create-client-org-modal";
import { CreateUserModal } from "@/components/create-user-modal";
import { CreateVendorModal } from "@/components/create-vendor-modal";
import { ResetPasswordModal } from "@/components/reset-password-modal";
import { ProfileHistory } from "@/components/profile-history";
import { Modal } from "@/components/interactive";
import { ROLES, type UserRoleLabel } from "@/lib/roles";

const ROLE_OPTIONS: UserRoleLabel[] = ["Super Admin", "Admin", "Project Manager", "Vendor", "Worker", "Complaint Creator"];

const roleTone: Record<string, string> = {
  "Super Admin": "bg-navy-950 text-white ring-navy-900/20",
  Admin: "bg-navy-100 text-navy-800 ring-navy-600/15",
  "Complaint Creator": "bg-sky-50 text-sky-700 ring-sky-600/15",
  Vendor: "bg-violet-50 text-violet-700 ring-violet-600/15",
  "Project Manager": "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  Worker: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

/** Treats missing flags as active; understands `status` strings and `is_active` booleans/numbers. */
function userActive(u: Row): boolean {
  const st = pick(u, "status");
  if (typeof st === "string") return st.toLowerCase() === "active";
  const f = pick(u, "is_active", "active");
  return f === undefined ? true : f === true || Number(f) === 1;
}

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [site, setSite] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [kind, setKind] = useState<"choose" | "org" | "building" | "admin" | "vendor" | null>(null);
  // `null` = closed, `{}` = open with no PM preselected, a row = open for that PM.
  const [assignFor, setAssignFor] = useState<Row | null>(null);
  const [resetFor, setResetFor] = useState<{ id: number; name: string; email: string } | null>(null);
  const [historyFor, setHistoryFor] = useState<{ id: number; name: string; email: string } | null>(null);
  const buildings = useApi(() => api.getBuildings());

  // Debounce the search box so each keystroke does not hit the server.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const list = useApi(
    () => api.getAllUsers({ role: role ? API_ROLE_BY_LABEL[role] : undefined, building_id: site ? Number(site) : undefined, search, page, limit }),
    [role, site, search, page, limit],
  );
  const rows = rowsOf(list.data?.data);

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

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone" className="pl-9" />
          </div>
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="w-48">
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Select value={site} onChange={(e) => { setSite(e.target.value); setPage(1); }} className="w-56">
            <option value="">All sites</option>
            {buildings.data?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
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
              {list.loading && (
                <tr><td colSpan={8} className="p-4"><ListSkeleton rows={4} className="rounded-none shadow-none ring-0" /></td></tr>
              )}
              {!list.loading && !list.error && rows.length === 0 && <NoDataRow cols={8} noApi />}
              {!list.loading && rows.map((u, i) => {
                const name = text(pick(u, "name", "user_name", "full_name"));
                const email = text(pick(u, "email", "user_email"), "");
                const roleRaw = text(pick(u, "role", "role_name"), "");
                const roleLabel = roleRaw ? ROLES[roleKeyFromApi(roleRaw)].label : "—";
                const active = userActive(u);
                const isPm = roleLabel === "Project Manager";
                const pmVendors = isPm ? managedVendorNames(u) : [];
                return (
                  <tr key={text(pick(u, "id", "user_id"), String(i))} className="hover:bg-slate-50/60">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">{email || text(pick(u, "phone"), "")}</p>
                        </div>
                      </div>
                    </td>
                    <td className={td}><Badge className={roleTone[roleLabel]}>{roleLabel}</Badge></td>
                    <td className={td}>{text(pick(u, "reports_to", "reports_to_name", "created_by_name"))}</td>
                    <td className={td}>{text(pick(u, "building_name", "site_name", "site"))}</td>
                    <td className={td}>
                      {isPm ? (
                        <span className="block max-w-[220px] truncate" title={pmVendors.join(", ")}>
                          {pmVendors.length ? pmVendors.join(", ") : <span className="text-slate-400">No vendors assigned</span>}
                        </span>
                      ) : (
                        text(pick(u, "vendor_name", "company_name", "organisation", "org"))
                      )}
                    </td>
                    <td className={td}>
                      <Badge
                        className={active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-rose-50 text-rose-700 ring-rose-600/15"}
                        dot={active ? "bg-emerald-500" : "bg-rose-500"}
                      >
                        {!active && <Lock className="size-3" />}
                        {active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className={td}>{timeText(pick(u, "last_login_at", "last_active", "last_login"))}</td>
                    <td className={cn(td, "text-right")}>
                      <div className="flex justify-end gap-1">
                        {isPm && (
                          <Button variant="ghost" size="sm" aria-label="Assign vendors" title="Assign vendors" onClick={() => setAssignFor(u)}>
                            <Truck />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Profile change history"
                          title="Profile change history"
                          disabled={!Number(pick(u, "user_id", "id"))}
                          onClick={() => setHistoryFor({ id: Number(pick(u, "user_id", "id")), name, email })}
                        >
                          <History />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Reset password"
                          title="Reset password"
                          disabled={!Number(pick(u, "user_id", "id"))}
                          onClick={() => setResetFor({ id: Number(pick(u, "user_id", "id")), name, email })}
                        >
                          <KeyRound />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="More">
                          <Ellipsis />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.error && <EmptyState icon={TriangleAlert} title="Could not load users" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}
        {list.data && <Pager page={page} limit={limit} total={list.data.pagination?.total} totalPages={list.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />}
      </Card>

      <Modal open={kind === "choose"} onClose={() => setKind(null)} title="Add user" description="What type of user do you want to create?" size="sm">
        <div className="space-y-2">
          {([
            ["org", "Client organisation", "Buildings plus their Complaint Creator and Client Admin"],
            ["building", "Buildings for an organisation", "Add buildings to an existing Complaint Creator & Client Admin"],
            ["admin", "Admin & other roles", "Admin, Project Manager, Worker, Complaint Creator"],
            ["vendor", "Vendor", "A vendor company with its sign-in user and sites"],
            ["assign", "Assign vendors to Project Manager", "Choose which vendors a Project Manager is responsible for"],
          ] as const).map(([k, t, d]) => (
            <button
              key={k}
              onClick={() => {
                if (k === "assign") {
                  setKind(null);
                  setAssignFor({});
                } else setKind(k);
              }}
              className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <p className="text-sm font-semibold text-slate-900">{t}</p>
              <p className="text-xs text-slate-500">{d}</p>
            </button>
          ))}
        </div>
      </Modal>
      <CreateClientOrgModal open={kind === "org"} onClose={() => setKind(null)} onCreated={() => { buildings.reload(); list.reload(); }} />
      <AddOrgBuildingsModal open={kind === "building"} onClose={() => setKind(null)} onCreated={() => { buildings.reload(); list.reload(); }} />
      <CreateUserModal open={kind === "admin"} onClose={() => setKind(null)} onCreated={list.reload} allowedRoles={ROLE_OPTIONS.filter((r) => r !== "Super Admin" && r !== "Vendor")} defaultRole="Admin" />
      <CreateVendorModal open={kind === "vendor"} onClose={() => setKind(null)} onCreated={list.reload} />
      <ResetPasswordModal user={resetFor} onClose={() => setResetFor(null)} />
      <Modal
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        title="Profile change history"
        description={historyFor ? `${historyFor.name}${historyFor.email ? ` · ${historyFor.email}` : ""}` : undefined}
        size="xl"
      >
        {historyFor && <div className="-mx-6 -my-5"><ProfileHistory userId={historyFor.id} /></div>}
      </Modal>
      <AssignVendorsModal open={!!assignFor} onClose={() => setAssignFor(null)} pm={assignFor && Object.keys(assignFor).length ? assignFor : null} onSaved={list.reload} />
    </>
  );
}
