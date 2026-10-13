"use client";

import { useState } from "react";
import { Building, Crosshair, HardHat, MapPin, Plus, TriangleAlert, Users } from "lucide-react";
import { PMS, SITES, USER_CAP_PER_SITE, VENDORS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button, Card, Field, Input, PageHeader, Progress, Select } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { LiveMap } from "@/components/live-map";

export default function SitesPage() {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Sites"
        description="Multi-site setup — each site has its own geo-fence, vendor mapping and a cap of 20 concurrent users."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add site
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {SITES.map((s, i) => {
          const full = s.users >= USER_CAP_PER_SITE;
          const pm = PMS.find((p) => p.site === s.name);
          return (
            <Card key={s.id} className="overflow-hidden">
              <LiveMap
                className="h-32 rounded-none"
                showControls={false}
                geofence={{ x: 50, y: 55, r: 16 + (s.geofence / 50) }}
                points={[{ id: s.id, x: 50, y: 55, kind: "site", tone: "violet", label: s.name }]}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3" />{s.region}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { i: Building, v: s.open, l: "Open" },
                    { i: HardHat, v: s.workers, l: "Workers" },
                    { i: Crosshair, v: `${s.geofence} m`, l: "Geo-fence" },
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
                    <span className={cn("font-bold tabular-nums", full ? "text-rose-600" : "text-slate-800")}>{s.users}/{USER_CAP_PER_SITE}</span>
                  </div>
                  <Progress value={(s.users / USER_CAP_PER_SITE) * 100} tone={full ? "bg-rose-500" : "bg-brand-500"} />
                  {full && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                      <TriangleAlert className="size-3" /> Cap reached — additional users chargeable separately
                    </p>
                  )}
                </div>
                <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <p>Vendor: <b className="text-slate-700">{VENDORS[i % VENDORS.length].name}</b></p>
                  <p>Project Manager: <b className="text-slate-700">{pm?.name ?? "Arjun Sharma"}</b></p>
                  <p>GPS: <span className="font-mono">{s.lat.toFixed(4)}°N, {s.lng.toFixed(4)}°E</span></p>
                </div>
              </div>
            </Card>
          );
        })}
        <button onClick={() => setOpen(true)} className="grid min-h-[300px] place-items-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-700">
          <span className="text-center">
            <Plus className="mx-auto size-7" />
            <span className="mt-2 block text-sm font-semibold">Add a new site</span>
            <span className="block text-xs">Scales with abcd’s operations</span>
          </span>
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add site"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { setOpen(false); toast.show("Site created"); }}>Create site</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name" required><Input placeholder="e.g. Sri City" /></Field>
          <Field label="Site code"><Input placeholder="e.g. SRC" /></Field>
          <Field label="Address" required className="sm:col-span-2"><Input placeholder="Plot, industrial area, city, state" /></Field>
          <Field label="Latitude"><Input placeholder="13.5236" /></Field>
          <Field label="Longitude"><Input placeholder="80.0115" /></Field>
          <Field label="Geo-fence radius" hint="Workers must be within this distance to check in"><Select><option>100 m</option><option>150 m</option><option>200 m</option><option>250 m</option></Select></Field>
          <Field label="Primary vendor"><Select>{VENDORS.map((v) => <option key={v.id}>{v.name}</option>)}</Select></Field>
          <p className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-600 sm:col-span-2">
            Each site includes up to <b>{USER_CAP_PER_SITE} concurrent users</b>. Additional users are chargeable separately.
          </p>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
