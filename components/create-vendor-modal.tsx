"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Button, Field, Input } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

const EMPTY = { company_name: "", contact_phone: "", user_name: "", user_email: "", password: "" };

/** Creates a vendor company and its sign-in user (createVendor), mapped to the chosen sites. */
export function CreateVendorModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [siteIds, setSiteIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const buildings = useApi(() => api.getBuildings(), [open]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (id: number) => setSiteIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const create = async () => {
    if (!form.company_name.trim() || !form.user_name.trim() || !form.user_email.trim() || !form.password) return setError("Company, user name, email and password are required.");
    setSaving(true);
    setError(null);
    try {
      await api.createVendor({ ...form, company_name: form.company_name.trim(), user_name: form.user_name.trim(), user_email: form.user_email.trim(), building_ids: siteIds });
      setForm(EMPTY);
      setSiteIds([]);
      toast.show("Vendor created");
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the vendor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Add vendor"
        description="Creates the vendor company together with its sign-in user."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} Create vendor</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" required><Input value={form.company_name} onChange={set("company_name")} placeholder="e.g. Sharma Electricals" /></Field>
          <Field label="Contact phone"><Input value={form.contact_phone} onChange={set("contact_phone")} placeholder="+91" /></Field>
          <p className="text-[13px] font-semibold text-slate-700 sm:col-span-2">Vendor user</p>
          <Field label="Full name" required><Input value={form.user_name} onChange={set("user_name")} placeholder="e.g. Vikram Sharma" /></Field>
          <Field label="Email" required><Input type="email" value={form.user_email} onChange={set("user_email")} placeholder="name@company.com" /></Field>
          <Field label="Password" required className="sm:col-span-2"><Input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" /></Field>
          <Field label="Sites" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {buildings.data?.length === 0 && <span className="text-xs text-slate-500">No sites yet</span>}
              {buildings.data?.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => toggle(b.id)}
                  aria-pressed={siteIds.includes(b.id)}
                  className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition", siteIds.includes(b.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </Field>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700 sm:col-span-2">{error}</p>}
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
