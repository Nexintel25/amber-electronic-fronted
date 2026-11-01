"use client";

import { useState } from "react";
import { Building, Info, Loader2, Mail, Pencil, Plus, TriangleAlert } from "lucide-react";
import { api, pick, rowsOf, text, type MailProfile, type Row } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, Field, Input, ListSkeleton, NoDataRow, PageHeader, Select, td, th } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

const EMPTY: MailProfile = { code: "", from_name: "", from_email: "", reply_to: null, env_prefix: "", is_default: false, is_active: true };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const flag = (v: unknown) => v === true || Number(v) === 1;

/** One API row → the editable profile shape. */
const toProfile = (r: Row): MailProfile => ({
  code: text(pick(r, "code"), ""),
  from_name: text(pick(r, "from_name"), ""),
  from_email: text(pick(r, "from_email"), ""),
  reply_to: (pick(r, "reply_to") as string | undefined) ?? null,
  env_prefix: (pick(r, "env_prefix") as string | undefined) ?? null,
  is_default: flag(pick(r, "is_default")),
  is_active: pick(r, "is_active") === undefined ? true : flag(pick(r, "is_active")),
});

/** Building names mapped to a profile, when the list response includes them. */
const buildingsOf = (r: Row): string[] => {
  const v = pick(r, "buildings", "building_names");
  if (Array.isArray(v)) return v.map((b) => (b && typeof b === "object" ? text(pick(b as Row, "building_name", "name"), "") : String(b))).filter(Boolean);
  return typeof v === "string" ? v.split(",").map((x) => x.trim()).filter(Boolean) : [];
};

export default function MailProfilesPage() {
  const toast = useToast();
  const list = useApi(() => api.getMailProfiles());
  const rows = rowsOf(list.data);
  const [edit, setEdit] = useState<{ profile: MailProfile; isNew: boolean } | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Mail profiles"
        description="The sender each client's emails go out as (e.g. RITES). Map buildings to a profile so their complaint and password-reset mails carry that brand."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(true)} disabled={!rows.length}>
              <Building /> Assign to buildings
            </Button>
            <Button onClick={() => setEdit({ profile: EMPTY, isNew: true })}>
              <Plus /> Add profile
            </Button>
          </>
        }
      />

      <p className="mb-4 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-[13px] text-sky-800">
        <Info className="mt-0.5 size-4 shrink-0" />
        SMTP passwords are never entered here. The server reads them from its own environment using each profile&apos;s env prefix (e.g. <code className="font-mono">RITES_SMTP_HOST</code>, <code className="font-mono">RITES_SMTP_PASS</code>).
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Code</th>
                <th className={th}>Sender</th>
                <th className={th}>Reply-to</th>
                <th className={th}>Env prefix</th>
                <th className={th}>Buildings</th>
                <th className={th}>Status</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.loading && (
                <tr><td colSpan={7} className="p-4"><ListSkeleton rows={3} className="rounded-none shadow-none ring-0" /></td></tr>
              )}
              {!list.loading && !list.error && rows.length === 0 && <NoDataRow cols={7} />}
              {!list.loading &&
                rows.map((r) => {
                  const p = toProfile(r);
                  const blds = buildingsOf(r);
                  const count = blds.length || Number(pick(r, "building_count")) || 0;
                  return (
                    <tr key={p.code} className="hover:bg-slate-50/60">
                      <td className={cn(td, "font-mono text-xs font-bold text-slate-800")}>{p.code}</td>
                      <td className={td}>
                        <p className="text-[13px] font-semibold text-slate-800">{p.from_name || "—"}</p>
                        <p className="text-xs text-slate-500">{p.from_email || "—"}</p>
                      </td>
                      <td className={cn(td, "text-xs")}>{p.reply_to || "—"}</td>
                      <td className={cn(td, "font-mono text-xs")}>{p.env_prefix || "—"}</td>
                      <td className={cn(td, "max-w-[240px] truncate text-xs")} title={blds.join(", ")}>{blds.length ? blds.join(", ") : count ? `${count} building${count === 1 ? "" : "s"}` : "—"}</td>
                      <td className={td}>
                        <div className="flex flex-wrap gap-1">
                          {p.is_default && <Badge className="bg-brand-50 text-brand-700 ring-brand-600/15">Default</Badge>}
                          <Badge className={p.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                        </div>
                      </td>
                      <td className={cn(td, "text-right")}>
                        <Button variant="ghost" size="sm" onClick={() => setEdit({ profile: p, isNew: false })} aria-label={`Edit ${p.code}`}>
                          <Pencil />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {list.error && <EmptyState icon={TriangleAlert} title="Could not load mail profiles" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}
      </Card>

      <ProfileModal
        key={edit ? `${edit.profile.code}-${edit.isNew}` : "closed"}
        edit={edit}
        onClose={() => setEdit(null)}
        onSaved={(code) => {
          toast.show(`Profile ${code} saved`);
          setEdit(null);
          list.reload();
        }}
      />
      <AssignModal
        open={assignOpen}
        profiles={rows.map(toProfile).filter((p) => p.is_active)}
        onClose={() => setAssignOpen(false)}
        onSaved={(n, code) => {
          toast.show(`${n} building${n === 1 ? "" : "s"} now send mail as ${code}`);
          setAssignOpen(false);
          list.reload();
        }}
      />
      {toast.node}
    </>
  );
}

/** Create or edit a profile; `code` is the key, so it is fixed once the profile exists. */
function ProfileModal({ edit, onClose, onSaved }: { edit: { profile: MailProfile; isNew: boolean } | null; onClose: () => void; onSaved: (code: string) => void }) {
  const [f, setF] = useState<MailProfile>(edit?.profile ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: "code" | "from_name" | "from_email" | "reply_to" | "env_prefix") => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    const p: MailProfile = {
      code: f.code.trim().toLowerCase(),
      from_name: f.from_name.trim(),
      from_email: f.from_email.trim().toLowerCase(),
      reply_to: f.reply_to?.trim() || null,
      env_prefix: f.env_prefix?.trim().toUpperCase() || null,
      is_default: f.is_default,
      is_active: f.is_active,
    };
    if (!/^[a-z0-9_-]+$/.test(p.code)) return setError("Code is required: lowercase letters, numbers, - or _.");
    if (!p.from_name || !EMAIL_RE.test(p.from_email)) return setError("Sender name and a valid sender email are required.");
    if (p.reply_to && !EMAIL_RE.test(p.reply_to)) return setError("Reply-to must be a valid email, or left empty.");
    setSaving(true);
    setError(null);
    try {
      await api.saveMailProfile(p);
      onSaved(p.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!edit}
      onClose={onClose}
      title={edit?.isNew ? "Add mail profile" : `Edit ${edit?.profile.code}`}
      description="Who the emails appear to come from."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Mail />} Save profile</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" required hint="Unique key, e.g. rites">
          <Input value={f.code} onChange={set("code")} disabled={!edit?.isNew} placeholder="rites" className="font-mono" />
        </Field>
        <Field label="Env prefix" hint="Server SMTP variables, e.g. RITES → RITES_SMTP_HOST">
          <Input value={f.env_prefix ?? ""} onChange={set("env_prefix")} placeholder="RITES" className="font-mono uppercase" />
        </Field>
        <Field label="Sender name" required>
          <Input value={f.from_name} onChange={set("from_name")} placeholder="RITES" />
        </Field>
        <Field label="Sender email" required>
          <Input type="email" value={f.from_email} onChange={set("from_email")} placeholder="complaints@rites-domain.com" />
        </Field>
        <Field label="Reply-to" hint="Optional — where replies go" className="sm:col-span-2">
          <Input type="email" value={f.reply_to ?? ""} onChange={set("reply_to")} placeholder="support@rites-domain.com" />
        </Field>
        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" className="size-4 accent-brand-500" checked={f.is_active} onChange={(e) => setF((x) => ({ ...x, is_active: e.target.checked }))} />
          Active
        </label>
        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" className="size-4 accent-brand-500" checked={f.is_default} onChange={(e) => setF((x) => ({ ...x, is_default: e.target.checked }))} />
          Default for buildings without a profile
        </label>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700 sm:col-span-2">{error}</p>}
      </div>
    </Modal>
  );
}

/** Map a set of buildings to one profile (admin/mail-profiles/assign). */
function AssignModal({ open, profiles, onClose, onSaved }: { open: boolean; profiles: MailProfile[]; onClose: () => void; onSaved: (count: number, code: string) => void }) {
  const buildings = useApi(() => api.getBuildings("", false), [open]);
  const [code, setCode] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const all = buildings.data?.map((b) => b.id) ?? [];
  const active = code || profiles[0]?.code || "";
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const close = () => {
    setPicked([]);
    setCode("");
    setError(null);
    onClose();
  };

  const save = async () => {
    if (!active) return setError("Choose a profile.");
    if (!picked.length) return setError("Tick at least one building.");
    setSaving(true);
    setError(null);
    try {
      await api.assignMailProfile(picked, active);
      const n = picked.length;
      setPicked([]);
      setCode("");
      onSaved(n, active);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign the profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Assign buildings to a mail profile"
      description="Emails about these buildings will be sent from the chosen profile."
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null} Assign</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Mail profile" required>
          <Select value={active} onChange={(e) => setCode(e.target.value)}>
            {profiles.length === 0 && <option value="">No active profiles</option>}
            {profiles.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.from_name} &lt;{p.from_email}&gt;</option>)}
          </Select>
        </Field>
        <Field label={`Buildings · ${picked.length} selected`}>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {buildings.loading && <Loader2 className="mx-auto size-5 animate-spin text-slate-400" />}
            {!!all.length && (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border-b border-slate-100 px-2 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                <input type="checkbox" className="size-4 accent-brand-500" checked={all.every((id) => picked.includes(id))} onChange={(e) => setPicked(e.target.checked ? all : [])} />
                All buildings
              </label>
            )}
            {buildings.data?.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-slate-50">
                <input type="checkbox" className="size-4 accent-brand-500" checked={picked.includes(b.id)} onChange={() => toggle(b.id)} />
                <span className="flex-1">{b.name}</span>
                <span className="font-mono text-[11px] text-slate-400">{b.code}</span>
              </label>
            ))}
          </div>
        </Field>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">{error}</p>}
      </div>
    </Modal>
  );
}
