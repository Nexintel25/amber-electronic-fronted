"use client";

import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { PMS, USERS } from "@/lib/data";
import { Avatar, Badge, Button, Card, NoData, NoDataRow, PageHeader, td, th } from "@/components/ui";
import { CreateUserModal } from "@/components/create-user-modal";
import { AssignVendorsModal } from "@/components/assign-vendors-modal";

export default function AdminTeam() {
  const [open, setOpen] = useState(false);
  const [assign, setAssign] = useState(false);
  const creators = USERS.filter((u) => u.role === "Complaint Creator");

  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Project Managers & creators"
        description="You create the Project Managers (who in turn create and own the vendors) and the people who raise complaints."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAssign(true)}>
              <Truck /> Assign vendors to PM
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus /> Add user
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {PMS.length === 0 && <Card><NoData /></Card>}
        {PMS.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-500">Project Manager · {p.site}</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/15" dot="bg-emerald-500">Active</Badge>
            </div>
            <p className="mt-4 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Responsible for vendors</p>
            <div className="flex flex-wrap gap-2">
              {p.vendors.map((v) => (
                <span key={v} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 ring-1 ring-slate-200/70">
                  <Truck className="size-3.5 text-slate-400" />
                  {v}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">{p.active} active complaints</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[15px] font-semibold text-slate-900">Complaint creators</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Site</th>
                <th className={th}>Reports to</th>
                <th className={th}>Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creators.length === 0 && <NoDataRow cols={3} />}
              {creators.map((u) => (
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
                  <td className={td}>{u.site}</td>
                  <td className={td}>{u.reportsTo}</td>
                  <td className={td}>{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AssignVendorsModal open={assign} onClose={() => setAssign(false)} />
      <CreateUserModal open={open} onClose={() => setOpen(false)} allowedRoles={["Project Manager", "Complaint Creator"]} />
    </>
  );
}
