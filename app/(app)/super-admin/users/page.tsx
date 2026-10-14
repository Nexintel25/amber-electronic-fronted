"use client";

import { useMemo, useState } from "react";
import { Ellipsis, KeyRound, Lock, Search, TriangleAlert, UserPlus } from "lucide-react";
import { SITES, USER_CAP_PER_SITE, USERS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Progress, Select, td, th } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { managersFor } from "@/components/create-user-modal";
import { PARENT_ROLE, type UserRoleLabel } from "@/lib/roles";

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
  const [open, setOpen] = useState(false);
  const [newSite, setNewSite] = useState(SITES[0].name);
  const [newRole, setNewRole] = useState<UserRoleLabel>("Admin");
  const parent = PARENT_ROLE[newRole];
  const toast = useToast();

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
  const target = SITES.find((s) => s.name === newSite);
  const atCap = target ? target.users >= USER_CAP_PER_SITE : false;

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="User management"
        description="The Super Admin creates every user. Chain of command: Super Admin → Admin → Project Manager → Vendor → Worker — each level then creates the level below it."
        actions={
          <Button onClick={() => setOpen(true)}>
            <UserPlus /> Add user
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {SITES.map((s) => {
          const full = s.users >= USER_CAP_PER_SITE;
          return (
            <Card key={s.id} className={cn("p-4", full && "ring-2 ring-rose-200")}>
              <div className="flex items-center justify-between">
                <p className="truncate text-[13px] font-semibold text-slate-800">{s.name}</p>
                {full && <TriangleAlert className="size-4 text-rose-500" />}
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {s.users}
                <span className="text-sm font-medium text-slate-400">/{USER_CAP_PER_SITE}</span>
              </p>
              <Progress value={(s.users / USER_CAP_PER_SITE) * 100} tone={full ? "bg-rose-500" : s.users > 15 ? "bg-amber-500" : "bg-emerald-500"} className="mt-2" />
              <p className={cn("mt-1.5 text-[11px]", full ? "font-semibold text-rose-600" : "text-slate-500")}>{full ? "Cap reached — extra users chargeable" : `${USER_CAP_PER_SITE - s.users} seats left`}</p>
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
            {SITES.map((s) => (
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
          Showing {rows.length} of 69 users
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add user"
        description="An invite with a secure sign-in link will be sent by email."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setOpen(false);
                toast.show("Invite sent");
              }}
            >
              {atCap ? "Add as chargeable user" : "Send invite"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required><Input placeholder="e.g. Pooja Negi" /></Field>
          <Field label="Phone"><Input placeholder="+91" /></Field>
          <Field label="Email" required className="sm:col-span-2"><Input type="email" placeholder="name@company.com" /></Field>
          <Field label="Role" required>
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRoleLabel)}>{ROLE_OPTIONS.filter((r) => r !== "Super Admin").map((r) => <option key={r}>{r}</option>)}</Select>
          </Field>
          <Field label="Site" required>
            <Select value={newSite} onChange={(e) => setNewSite(e.target.value)}>
              {SITES.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          {parent && (
            <Field label={`Reports to (${parent})`} required className="sm:col-span-2">
              <Select key={newRole}>{managersFor(newRole).map((m) => <option key={m}>{m}</option>)}</Select>
            </Field>
          )}
          <Field label="Organisation" className="sm:col-span-2">
            <Select>
              <option>NADT</option>
              <option>PowerGrid Services</option>
              <option>Voltline Engineering</option>
              <option>Spark Facility Solutions</option>
              <option>TechServe Electricals</option>
            </Select>
          </Field>
          {target && (
            <div className={cn("flex items-start gap-3 rounded-xl p-3 sm:col-span-2", atCap ? "bg-rose-50" : "bg-slate-50")}>
              {atCap ? <TriangleAlert className="mt-0.5 size-4 text-rose-600" /> : <KeyRound className="mt-0.5 size-4 text-slate-500" />}
              <p className={cn("text-[13px]", atCap ? "text-rose-800" : "text-slate-600")}>
                {atCap
                  ? `${target.name} has reached its ${USER_CAP_PER_SITE}-user cap. Additional users are chargeable separately.`
                  : `${target.name}: ${target.users}/${USER_CAP_PER_SITE} users. This user will take 1 seat.`}
              </p>
            </div>
          )}
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
