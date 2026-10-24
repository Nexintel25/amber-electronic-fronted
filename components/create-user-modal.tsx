"use client";

import { useState } from "react";
import { Loader2, Network } from "lucide-react";
import { API_ROLE_BY_LABEL, api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import type { UserRoleLabel } from "@/lib/roles";
import { Button, Field, Input, Select } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

const EMPTY = { name: "", phone: "", email: "", password: "", building_id: "", vendor_id: "" };

/**
 * Create-user dialog that enforces the reporting chain:
 * Super Admin → Admin → Project Manager → Vendor → Worker (Complaint Creators report to an Admin).
 * `allowedRoles` is what the signed-in panel may create. Workers and vendors belong to a vendor company,
 * which is locked to the signed-in vendor's own company when they have one.
 */
export function CreateUserModal({
  open,
  onClose,
  allowedRoles,
  defaultRole,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  allowedRoles: UserRoleLabel[];
  defaultRole?: UserRoleLabel;
  /** Called after the user has been created, e.g. to refresh a list. */
  onCreated?: () => void;
  /** Kept for existing call sites; the API has no "reports to" field. */
  fixedManager?: string;
}) {
  const toast = useToast();
  const session = useSession();
  const [role, setRole] = useState<UserRoleLabel>(defaultRole ?? allowedRoles[0]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildings = useApi(() => api.getBuildings(), [open]);
  const vendors = useApi(() => api.getVendors(), [open]);

  const needsVendor = role === "Vendor" || role === "Worker";
  const ownVendorId = session?.user.role === "vendor" ? session.user.vendor_id : null;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError("Name, email and password are required.");
    const vendorId = ownVendorId ?? (form.vendor_id ? Number(form.vendor_id) : null);
    if (role === "Worker" && !vendorId) return setError("Choose the vendor this worker belongs to.");
    setSaving(true);
    setError(null);
    try {
      await api.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: API_ROLE_BY_LABEL[role],
        vendor_id: needsVendor ? vendorId : null,
        building_id: form.building_id ? Number(form.building_id) : null,
      });
      toast.show(`${role} created`);
      setForm(EMPTY);
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Add ${role.toLowerCase()}`}
        description="The user can sign in with this email and password straight away."
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null} Create {role.toLowerCase()}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required><Input value={form.name} onChange={set("name")} placeholder="e.g. Pooja Negi" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={set("phone")} placeholder="+91" /></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" /></Field>
          <Field label="Password" required><Input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" /></Field>
          <Field label="Role" required>
            <Select value={role} onChange={(e) => setRole(e.target.value as UserRoleLabel)} disabled={allowedRoles.length === 1}>
              {allowedRoles.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Site">
            <Select value={form.building_id} onChange={set("building_id")}>
              <option value="">No site</option>
              {buildings.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          {needsVendor && (
            <Field label="Vendor company" required={role === "Worker"} className="sm:col-span-2">
              <Select value={ownVendorId ? String(ownVendorId) : form.vendor_id} onChange={set("vendor_id")} disabled={!!ownVendorId}>
                <option value="">Select vendor</option>
                {vendors.data?.map((v) => <option key={v.id} value={v.id}>{v.company_name}</option>)}
              </Select>
            </Field>
          )}
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700 sm:col-span-2">{error}</p>}
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 sm:col-span-2">
            <Network className="mt-0.5 size-4 text-slate-500" />
            <p className="text-[13px] text-slate-600">
              Chain of command: <b>Super Admin → Admin → Project Manager → Vendor → Worker</b>. Each level creates and manages the level directly below it.
            </p>
          </div>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
