"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api, pick, rowsOf, text, type Row } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Button, Field, NoData, Select } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

/**
 * Vendor ids in a user row's `managed_vendors`, which may be a list of ids, a list of
 * `{ vendor_id | id, company_name }` objects, or a comma-separated string.
 */
export function managedVendorIds(u: Row | null | undefined): number[] {
  const v = pick(u, "managed_vendors", "vendor_ids");
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return list.map((x) => Number(x && typeof x === "object" ? pick(x as Row, "vendor_id", "id") : x)).filter((n) => n > 0);
}

/** Company names in `managed_vendors`, when it carries them. */
export function managedVendorNames(u: Row): string[] {
  const v = pick(u, "managed_vendors");
  return Array.isArray(v) ? v.map((x) => (x && typeof x === "object" ? text(pick(x as Row, "company_name", "name"), "") : "")).filter(Boolean) : [];
}

/** Admin: choose which vendors a Project Manager is responsible for (setPmVendors). Replaces the PM's whole list. */
export function AssignVendorsModal({ open, onClose, pm, onSaved }: { open: boolean; onClose: () => void; pm?: Row | null; onSaved?: () => void }) {
  const toast = useToast();
  const vendors = useApi(() => api.getVendors(), [open]);
  const pms = useApi(() => api.getAllUsers({ role: "project_manager", page: 1, limit: 100 }), [open]);
  const pmRows = rowsOf(pms.data?.data);
  const idOf = (u: Row | null | undefined) => text(pick(u, "user_id", "id"), "");

  const [pmId, setPmId] = useState("");
  // Ticks start from the chosen PM's current vendors and are kept per PM once edited.
  const [edited, setEdited] = useState<Record<string, number[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePm = pmId || idOf(pm);
  const pmRow = pmRows.find((u) => idOf(u) === activePm) ?? pm;
  const picked = edited[activePm] ?? managedVendorIds(pmRow);
  const setPicked = (ids: number[]) => setEdited((e) => ({ ...e, [activePm]: ids }));
  const toggle = (id: number) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const allIds = vendors.data?.map((v) => v.id) ?? [];

  const close = () => {
    setPmId("");
    setEdited({});
    setError(null);
    onClose();
  };

  const save = async () => {
    if (!Number(activePm)) return setError("Choose a Project Manager.");
    setSaving(true);
    setError(null);
    try {
      await api.setPmVendors(Number(activePm), picked);
      toast.show(`${picked.length} vendor${picked.length === 1 ? "" : "s"} assigned to ${text(pick(pmRow, "name"), `PM #${activePm}`)}`);
      onSaved?.();
      close();
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
        onClose={close}
        title="Assign vendors to a Project Manager"
        description="The PM monitors complaints and workers of the vendors ticked below. Saving replaces their current list."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button disabled={saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : null} Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Project Manager" required>
            <Select value={activePm} onChange={(e) => setPmId(e.target.value)}>
              <option value="">{pms.loading ? "Loading…" : "Select project manager"}</option>
              {/* Keep a preselected PM visible even if it is not in the first page of results. */}
              {pm && !pmRows.some((u) => idOf(u) === idOf(pm)) && <option value={idOf(pm)}>{text(pick(pm, "name"))}</option>}
              {pmRows.map((u) => (
                <option key={idOf(u)} value={idOf(u)}>{text(pick(u, "name"))} · {text(pick(u, "email"), "")}</option>
              ))}
            </Select>
          </Field>
          {pms.data && pmRows.length === 0 && !pm && <p className="text-[13px] text-slate-500">No Project Managers yet — create one from Add user first.</p>}
          <Field label={`Vendors · ${picked.length} selected`}>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {vendors.loading && <Loader2 className="mx-auto size-5 animate-spin text-slate-400" />}
              {vendors.data?.length === 0 && <NoData className="py-4" />}
              {!!allIds.length && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border-b border-slate-100 px-2 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-500"
                    checked={allIds.every((id) => picked.includes(id))}
                    onChange={(e) => setPicked(e.target.checked ? allIds : [])}
                  />
                  All vendors
                </label>
              )}
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
