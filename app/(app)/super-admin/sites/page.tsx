"use client";

import { useState } from "react";
import { Building, HardHat, Loader2, MapPin, Plus, TriangleAlert, Users } from "lucide-react";
import { api, type AdminDashboard } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Button, Card, EmptyState, PageHeader, Progress } from "@/components/ui";
import { CreateSiteModal } from "@/components/create-site-modal";
import { LiveMap } from "@/components/live-map";

type Site = AdminDashboard["sites"][number];

export default function SitesPage() {
  const [open, setOpen] = useState(false);

  const buildings = useApi(() => api.getBuildings("", false));
  // Per-site counters come from the admin dashboard; they are optional extras, so a failure here is ignored.
  const stats = useApi(() => api.getAdminDashboard().then((d) => d.sites).catch(() => [] as Site[]));
  const statOf = (id: number) => stats.data?.find((x) => x.building_id === id);

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Sites"
        description="Multi-site setup — each site has its own vendor mapping and a cap of 20 concurrent users."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add site
          </Button>
        }
      />

      {buildings.loading && (
        <div className="grid place-items-center py-20 text-slate-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}
      {buildings.error && <EmptyState icon={TriangleAlert} title="Could not load sites" text={buildings.error} action={<Button onClick={buildings.reload}>Try again</Button>} />}

      {buildings.data && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {buildings.data.map((b) => {
            const st = statOf(b.id);
            const users = st?.concurrent_users ?? 0;
            const cap = st?.max_concurrent_users;
            const full = cap != null && users >= cap;
            return (
              <Card key={b.id} className="overflow-hidden">
                <LiveMap
                  className="h-32 rounded-none"
                  showControls={false}
                  geofence={{ x: 50, y: 55, r: 18 }}
                  points={[{ id: String(b.id), x: 50, y: 55, kind: "site", tone: "violet", label: b.name }]}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3" />{b.address}, {b.city}</p>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>{b.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { i: Building, v: st?.open_complaints ?? "—", l: "Open" },
                      { i: HardHat, v: st?.workers ?? "—", l: "Workers" },
                      { i: Users, v: st?.project_managers ?? "—", l: "PMs" },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg bg-slate-50 py-2">
                        <x.i className="mx-auto size-3.5 text-slate-400" />
                        <p className="mt-1 text-sm font-bold text-slate-900">{x.v}</p>
                        <p className="text-[10px] text-slate-500">{x.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-500"><Users className="size-3.5" /> Concurrent users</span>
                      <span className={cn("font-bold tabular-nums", full ? "text-rose-600" : "text-slate-800")}>{st ? `${users}/${cap}` : "—"}</span>
                    </div>
                    {cap ? <Progress value={(users / cap) * 100} tone={full ? "bg-rose-500" : "bg-brand-500"} /> : null}
                    {full && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <TriangleAlert className="size-3" /> Cap reached — additional users chargeable separately
                      </p>
                    )}
                  </div>
                  <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <p>Code: <b className="font-mono text-slate-700">{b.code}</b></p>
                    <p>Vendor: <b className="text-slate-700">{b.vendor_name ?? "Not mapped"}</b></p>
                    <p>SLA tracking: <b className="text-slate-700">{b.sla_enabled ? "Enabled" : "Disabled"}</b></p>
                  </div>
                </div>
              </Card>
            );
          })}
          <button onClick={() => setOpen(true)} className="grid min-h-[300px] place-items-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-700">
            <span className="text-center">
              <Plus className="mx-auto size-7" />
              <span className="mt-2 block text-sm font-semibold">Add a new site</span>
              <span className="block text-xs">Scales with Amber’s operations</span>
            </span>
          </button>
        </div>
      )}

      <CreateSiteModal open={open} onClose={() => setOpen(false)} onCreated={() => { buildings.reload(); stats.reload(); }} />
    </>
  );
}
