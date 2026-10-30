"use client";

import { useState } from "react";
import { Building, Mail, Phone, Plus, TriangleAlert, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Avatar, Badge, Button, Card, EmptyState, ListSkeleton, PageHeader, td, th } from "@/components/ui";
import { CreateUserModal } from "@/components/create-user-modal";

export default function PMVendors() {
  const [open, setOpen] = useState(false);
  const vendors = useApi(() => api.getVendors("", false));

  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel"
        title="My vendors"
        description="Create vendor accounts and see the sites and workers each vendor covers. Vendors create and manage their own workers."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add vendor
          </Button>
        }
      />

      {vendors.loading && <ListSkeleton />}
      {vendors.error && <EmptyState icon={TriangleAlert} title="Could not load vendors" text={vendors.error} action={<Button onClick={vendors.reload}>Try again</Button>} />}
      {vendors.data && vendors.data.length === 0 && <EmptyState icon={Truck} title="No vendors yet" text="Add a vendor to start assigning complaints." />}

      {vendors.data && vendors.data.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {vendors.data.map((v) => (
              <Card key={v.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-white"><Truck className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{v.company_name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500"><Avatar name={v.contact_name} size="xs" />{v.contact_name}</p>
                  </div>
                  <Badge className={v.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"}>{v.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="flex items-center justify-center gap-1 text-sm font-bold text-slate-900"><Building className="size-3.5 text-slate-400" />{v.building_count}</p>
                    <p className="text-[10px] text-slate-500">Sites</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-bold text-slate-900">{v.worker_count}</p>
                    <p className="text-[10px] text-slate-500">Workers</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-[13px] text-slate-600">
                  <p className="flex items-center gap-2"><Mail className="size-3.5 text-slate-400" />{v.contact_email}</p>
                  <p className="flex items-center gap-2"><Phone className="size-3.5 text-slate-400" />{v.contact_phone}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[15px] font-semibold text-slate-900">Vendor accounts</p>
              <p className="text-[13px] text-slate-500">{vendors.data.length} vendor{vendors.data.length === 1 ? "" : "s"}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className={th}>Vendor</th>
                    <th className={th}>Contact</th>
                    <th className={th}>Sites</th>
                    <th className={th}>Workers</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.data.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60">
                      <td className={td}><span className="font-semibold text-slate-900">{v.company_name}</span></td>
                      <td className={td}><span className="flex items-center gap-1.5"><Mail className="size-3.5 text-slate-400" />{v.contact_name}</span></td>
                      <td className={td}>{v.building_count}</td>
                      <td className={td}>{v.worker_count}</td>
                      <td className={td}>
                        <Badge className={v.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"} dot={v.is_active ? "bg-emerald-500" : "bg-slate-400"}>
                          {v.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <CreateUserModal open={open} onClose={() => setOpen(false)} allowedRoles={["Vendor"]} onCreated={vendors.reload} />
    </>
  );
}
