"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button, Field, Input, NoData } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

/** Admin: choose which vendors a Project Manager is responsible for (setPmVendors). */
export function AssignVendorsModal({ open, onClose, pmId: initialPm = "" }: { open: boolean; onClose: () => void; pmId?: string }) {
  const toast = useToast();
  const vendors = useApi(() => api.getVendors(), []);
  const [pmId, setPmId] = useState(initialPm);
  const [picked, setPicked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = async () => {
    if (!Number(pmId)) return setError("Enter the Project Manager’s user ID.");
    setSaving(true);
    setError(null);
    try {
      await api.setPmVendors(Number(pmId), picked);
      toast.show(`${picked.length} vendor${picked.length === 1 ? "" : "s"} assigned to PM #${pmId}`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign vendors.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Assign vendors to a Project Manager"
        description="Replaces the PM’s current vendor list with the vendors ticked below."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button disabled={saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : null} Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Project Manager user ID" required>
            <Input type="number" min={1} value={pmId} onChange={(e) => setPmId(e.target.value)} placeholder="e.g. 2" />
          </Field>
          <Field label="Vendors">
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {vendors.loading && <Loader2 className="mx-auto size-5 animate-spin text-slate-400" />}
              {vendors.data?.length === 0 && <NoData className="py-4" />}
              {vendors.data?.map((v) => (
                <label key={v.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-slate-50">
                  <input type="checkbox" className="size-4 accent-brand-500" checked={picked.includes(v.id)} onChange={() => toggle(v.id)} />
                  {v.company_name}
                </label>
              ))}
            </div>
          </Field>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">{error}</p>}
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
