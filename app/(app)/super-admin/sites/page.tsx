"use client";

import { useState } from "react";
import { Building, HardHat, Loader2, MapPin, Plus, TriangleAlert, Users } from "lucide-react";
import { USER_CAP_PER_SITE } from "@/lib/data";
import { api, type AdminDashboard } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Button, Card, EmptyState, Field, Input, PageHeader, Progress, Select } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { LiveMap } from "@/components/live-map";

type Site = AdminDashboard["sites"][number];

const EMPTY = { building_name: "", building_code: "", address: "", city: "", sla_enabled: true, user_name: "", user_email: "", user_phone: "", password: "", vendor_id: "" };

export default function SitesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();

  const buildings = useApi(() => api.getBuildings("", false));
  const vendors = useApi(() => api.getVendors());
  // Per-site counters come from the admin dashboard; they are optional extras, so a failure here is ignored.
  const stats = useApi(() => api.getAdminDashboard().then((d) => d.sites).catch(() => [] as Site[]));
  const statOf = (id: number) => stats.data?.find((x) => x.building_id === id);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    const f = form;
    if (!f.building_name.trim() || !f.building_code.trim() || !f.address.trim() || !f.city.trim()) return setFormError("Site name, code, address and city are required.");
    if (!f.user_name.trim() || !f.user_email.trim() || !f.password) return setFormError("Site user name, email and password are required.");
    setSaving(true);
    setFormError(null);
    try {
      await api.createBuildingWithUser({ ...f, vendor_id: f.vendor_id ? Number(f.vendor_id) : null });
      setOpen(false);
      setForm(EMPTY);
      toast.show("Site created");
      buildings.reload();
      stats.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create the site.");
    } finally {
      setSaving(false);
    }
  };

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
            const full = users >= (st?.max_concurrent_users ?? USER_CAP_PER_SITE);
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
                      <span className={cn("font-bold tabular-nums", full ? "text-rose-600" : "text-slate-800")}>{users}/{st?.max_concurrent_users ?? USER_CAP_PER_SITE}</span>
                    </div>
                    <Progress value={(users / (st?.max_concurrent_users ?? USER_CAP_PER_SITE)) * 100} tone={full ? "bg-rose-500" : "bg-brand-500"} />
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add site"
        description="Creates the site together with its sign-in user."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} Create site</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name" required><Input value={form.building_name} onChange={set("building_name")} placeholder="e.g. Amber Tower B" /></Field>
          <Field label="Site code" required><Input value={form.building_code} onChange={set("building_code")} placeholder="e.g. ATB" /></Field>
          <Field label="Address" required><Input value={form.address} onChange={set("address")} placeholder="Street, area" /></Field>
          <Field label="City" required><Input value={form.city} onChange={set("city")} placeholder="e.g. Kolkata" /></Field>
          <Field label="Primary vendor">
            <Select value={form.vendor_id} onChange={set("vendor_id")}>
              <option value="">No vendor yet</option>
              {vendors.data?.map((v) => <option key={v.id} value={v.id}>{v.company_name}</option>)}
            </Select>
          </Field>
          <Field label="SLA tracking">
            <Select value={form.sla_enabled ? "1" : "0"} onChange={(e) => setForm((f) => ({ ...f, sla_enabled: e.target.value === "1" }))}>
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </Select>
          </Field>
          <p className="text-[13px] font-semibold text-slate-700 sm:col-span-2">Site user</p>
          <Field label="Full name" required><Input value={form.user_name} onChange={set("user_name")} placeholder="e.g. Rahul Barma" /></Field>
          <Field label="Phone"><Input value={form.user_phone} onChange={set("user_phone")} placeholder="+91" /></Field>
          <Field label="Email" required><Input type="email" value={form.user_email} onChange={set("user_email")} placeholder="name@company.com" /></Field>
          <Field label="Password" required><Input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" /></Field>
          {formError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700 sm:col-span-2">{formError}</p>}
          <p className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-600 sm:col-span-2">
            Each site includes up to <b>{USER_CAP_PER_SITE} concurrent users</b>. Additional users are chargeable separately.
          </p>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
