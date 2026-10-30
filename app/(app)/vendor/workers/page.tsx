"use client";

import { useState } from "react";
import { Mail, Phone, TriangleAlert, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { workerView } from "@/lib/vendor-workers";
import { CreateUserModal } from "@/components/create-user-modal";
import { Avatar, Badge, Button, Card, EmptyState, ListSkeleton, PageHeader, td, th } from "@/components/ui";

export default function WorkersPage() {
  const session = useSession();
  const [addWorker, setAddWorker] = useState(false);
  // A vendor sees their own company; other roles that open this page see the first vendor.
  const vendorId = useApi(async () => session?.user.vendor_id ?? (await api.getVendors())[0]?.id ?? null, [session?.user.vendor_id]);
  const workers = useApi(async () => (vendorId.data ? api.getVendorWorkers(vendorId.data) : []), [vendorId.data]);
  const list = (workers.data ?? []).map(workerView);
  const loading = vendorId.loading || workers.loading;
  const error = vendorId.error ?? workers.error;

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel"
        title="My workers"
        description="Create the workers who receive your jobs on the mobile app."
        actions={
          <Button onClick={() => setAddWorker(true)}>
            <UserPlus /> Add worker
          </Button>
        }
      />

      {loading && <ListSkeleton />}
      {error && <EmptyState icon={TriangleAlert} title="Could not load workers" text={error} action={<Button onClick={() => { vendorId.reload(); workers.reload(); }}>Try again</Button>} />}

      {!loading && !error && (
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-slate-900"><Users className="size-4" /> Worker roster</p>
            <span className="text-xs text-slate-500">{list.length} worker{list.length === 1 ? "" : "s"}</span>
          </div>
          {list.length === 0 ? (
            <EmptyState icon={Users} title="No workers yet" text="Add a worker so you can distribute complaints to them." action={<Button onClick={() => setAddWorker(true)}><UserPlus /> Add worker</Button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className={th}>Worker</th>
                    <th className={th}>Phone</th>
                    <th className={th}>Email</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Avatar name={w.name} size="sm" />
                          <p className="font-semibold text-slate-900">{w.name}</p>
                        </div>
                      </td>
                      <td className={td}>{w.phone ? <span className="flex items-center gap-1.5"><Phone className="size-3.5 text-slate-400" />{w.phone}</span> : "—"}</td>
                      <td className={td}>{w.email ? <span className="flex items-center gap-1.5"><Mail className="size-3.5 text-slate-400" />{w.email}</span> : "—"}</td>
                      <td className={td}>
                        <Badge className={w.active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"} dot={w.active ? "bg-emerald-500" : "bg-slate-400"}>
                          {w.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <CreateUserModal open={addWorker} onClose={() => setAddWorker(false)} allowedRoles={["Worker"]} onCreated={workers.reload} />
    </>
  );
}
