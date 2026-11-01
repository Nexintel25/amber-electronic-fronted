"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button, Field, Input, Select } from "@/components/ui";
import { Modal, useToast, PasswordInput } from "@/components/interactive";
import { BuildingNamesField, parseBuildings } from "@/components/add-org-buildings-modal";

const EMPTY = {
  code_prefix: "",
  city: "",
  vendor_id: "",
  buildings: "",
  creator_name: "",
  creator_email: "",
  creator_phone: "",
  creator_password: "",
  admin_name: "",
  admin_email: "",
  admin_phone: "",
  admin_password: "",
};

/** Creates a client organisation (createClientOrg): its buildings, a Complaint Creator and a Client Admin in one request. */
export function CreateClientOrgModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();
  const vendors = useApi(() => api.getVendors(), [open]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    const f = form;
    const buildings = parseBuildings(f.buildings);
    if (!f.code_prefix.trim() || !f.city.trim()) return setFormError("Code prefix and city are required.");
    if (!buildings.length) return setFormError("Add at least one building.");
    if (!f.creator_name.trim() || !f.creator_email.trim() || !f.creator_password) return setFormError("Complaint Creator name, email and password are required.");
    if (!f.admin_name.trim() || !f.admin_email.trim() || !f.admin_password) return setFormError("Client Admin name, email and password are required.");
    setSaving(true);
    setFormError(null);
    try {
      await api.createClientOrg({
        code_prefix: f.code_prefix.trim().toUpperCase(),
        city: f.city.trim(),
        vendor_id: f.vendor_id ? Number(f.vendor_id) : null,
        buildings,
        creator_name: f.creator_name.trim(),
        creator_email: f.creator_email.trim(),
        creator_phone: f.creator_phone.trim(),
        creator_password: f.creator_password,
        admin_name: f.admin_name.trim(),
        admin_email: f.admin_email.trim(),
        admin_phone: f.admin_phone.trim(),
        admin_password: f.admin_password,
      });
      setForm(EMPTY);
      toast.show("Client organisation created");
      onCreated?.();
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create the organisation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Add client organisation"
        description="Creates the buildings plus a Complaint Creator and a Client Admin who can sign in straight away."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} Create organisation</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code prefix" required><Input value={form.code_prefix} onChange={set("code_prefix")} placeholder="e.g. RITES" className="uppercase" /></Field>
          <Field label="City" required><Input value={form.city} onChange={set("city")} placeholder="e.g. Kolkata" /></Field>
          <Field label="Primary vendor" className="sm:col-span-2">
            <Select value={form.vendor_id} onChange={set("vendor_id")}>
              <option value="">No vendor yet</option>
              {vendors.data?.map((v) => <option key={v.id} value={v.id}>{v.company_name}</option>)}
            </Select>
          </Field>
          <BuildingNamesField value={form.buildings} onChange={(buildings) => setForm((f) => ({ ...f, buildings }))} prefix={form.code_prefix} />

          <p className="text-[13px] font-semibold text-slate-700 sm:col-span-2">Complaint Creator</p>
          <Field label="Full name" required><Input value={form.creator_name} onChange={set("creator_name")} placeholder="e.g. RITES Complaint Desk" /></Field>
          <Field label="Phone"><Input value={form.creator_phone} onChange={set("creator_phone")} placeholder="+91" /></Field>
          <Field label="Email" required><Input type="email" value={form.creator_email} onChange={set("creator_email")} placeholder="complaints@company.com" /></Field>
          <Field label="Password" required><PasswordInput value={form.creator_password} onChange={set("creator_password")} autoComplete="new-password" /></Field>

          <p className="text-[13px] font-semibold text-slate-700 sm:col-span-2">Client Admin</p>
          <Field label="Full name" required><Input value={form.admin_name} onChange={set("admin_name")} placeholder="e.g. RITES Admin" /></Field>
          <Field label="Phone"><Input value={form.admin_phone} onChange={set("admin_phone")} placeholder="+91" /></Field>
          <Field label="Email" required><Input type="email" value={form.admin_email} onChange={set("admin_email")} placeholder="admin@company.com" /></Field>
          <Field label="Password" required><PasswordInput value={form.admin_password} onChange={set("admin_password")} autoComplete="new-password" /></Field>

          {formError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700 sm:col-span-2">{formError}</p>}
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
