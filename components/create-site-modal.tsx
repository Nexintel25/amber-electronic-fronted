"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button, Field, Input, Select } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

const EMPTY = { building_name: "", building_code: "", address: "", city: "", sla_enabled: true, user_name: "", user_email: "", user_phone: "", password: "", vendor_id: "" };

/** Creates a site together with its sign-in user (createBuildingWithUser). Vendor is optional and sent as null when not chosen. */
export function CreateSiteModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();
  const vendors = useApi(() => api.getVendors(), [open]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    const f = form;
    if (!f.building_name.trim() || !f.building_code.trim() || !f.address.trim() || !f.city.trim()) return setFormError("Site name, code, address and city are required.");
    if (!f.user_name.trim() || !f.user_email.trim() || !f.password) return setFormError("Site user name, email and password are required.");
    setSaving(true);
    setFormError(null);
    try {
      await api.createBuildingWithUser({ ...f, vendor_id: f.vendor_id ? Number(f.vendor_id) : null });
      setForm(EMPTY);
      toast.show("Site and user created");
      onCreated?.();
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create the site.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Add site & user"
        description="Creates the site together with its sign-in user."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} Create</Button>
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
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
