"use client";

import { useState } from "react";
import { Mail, Plus, Star, Truck } from "lucide-react";
import { COMPLAINTS, PMS, VENDORS, inr, penaltyOf } from "@/lib/data";
import { Avatar, Badge, Button, Card, PageHeader, Progress, td, th } from "@/components/ui";
import { CreateUserModal } from "@/components/create-user-modal";

const ME = PMS[0];

export default function PMVendors() {
  const [open, setOpen] = useState(false);
  const vendors = VENDORS.filter((v) => ME.vendors.includes(v.name));

  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel"
        title="My vendors"
        description="Create vendor accounts and track how each one performs. Vendors create and manage their own workers."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add vendor
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {vendors.map((v) => {
          const pens = COMPLAINTS.filter((c) => c.vendor === v.name).map(penaltyOf);
          return (
            <Card key={v.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-white"><Truck className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{v.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500"><Avatar name={v.contact} size="xs" />{v.contact} · {v.workers} workers</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold text-slate-800"><Star className="size-4 fill-brand-400 text-brand-400" />{v.rating}</span>
              </div>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  { l: "SLA compliance", v: `${v.sla}%`, p: v.sla, tone: v.sla >= 90 ? "bg-emerald-500" : "bg-rose-500" },
                  { l: "Closed / assigned", v: `${v.closed}/${v.assigned}`, p: (v.closed / v.assigned) * 100, tone: "bg-brand-500" },
                  { l: "Rework rate", v: `${v.rework}%`, p: v.rework * 5, tone: "bg-amber-500" },
                ].map((r) => (
                  <div key={r.l}>
                    <div className="mb-1 flex justify-between"><span className="text-slate-600">{r.l}</span><span className="font-semibold text-slate-900 tabular-nums">{r.v}</span></div>
                    <Progress value={r.p} tone={r.tone} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px]">
                <span className="text-slate-600">Penalty (levied + accruing)</span>
                <b className={pens.some((p) => p.amount) ? "text-rose-600" : "text-emerald-600"}>{inr(pens.reduce((a, p) => a + p.amount, 0))}</b>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[15px] font-semibold text-slate-900">Vendor accounts</p>
          <p className="text-[13px] text-slate-500">Reports to {ME.name} (Project Manager)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Vendor</th>
                <th className={th}>Contact</th>
                <th className={th}>Workers</th>
                <th className={th}>Avg turnaround</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60">
                  <td className={td}><span className="font-semibold text-slate-900">{v.name}</span></td>
                  <td className={td}><span className="flex items-center gap-1.5"><Mail className="size-3.5 text-slate-400" />{v.contact}</span></td>
                  <td className={td}>{v.workers}</td>
                  <td className={td}>{v.avgTat} h</td>
                  <td className={td}><Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/15" dot="bg-emerald-500">Active</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateUserModal open={open} onClose={() => setOpen(false)} allowedRoles={["Vendor"]} fixedManager={ME.name} />
    </>
  );
}
