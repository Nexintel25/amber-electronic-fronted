"use client";

import { useState } from "react";
import { Loader2, Search, Send, TriangleAlert, Wrench } from "lucide-react";
import { api, num, pick, rowsOf, text, timeText, type Row } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, ListSkeleton, NoData, Select, Textarea } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { Pager } from "@/components/pager";

export const TICKET_AREAS = [
  { value: "web", label: "Web dashboard" },
  { value: "worker_app", label: "Worker mobile app" },
  { value: "pm_vendor_app", label: "PM / Vendor mobile app" },
  { value: "notifications", label: "Notifications" },
  { value: "reports", label: "Reports" },
  { value: "access", label: "Access / login" },
];
export const TICKET_SEVERITIES = [
  { value: "low", label: "Low — question" },
  { value: "medium", label: "Medium — feature not working" },
  { value: "high", label: "High — blocking my work" },
  { value: "critical", label: "Critical — platform down" },
];
export const TICKET_STATUSES = ["open", "pending", "resolved"];

const statusTone = (s: string) =>
  s === "resolved" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : s === "open" ? "bg-sky-50 text-sky-700 ring-sky-600/15" : "bg-amber-50 text-amber-700 ring-amber-600/20";

const ticketId = (r: Row) => num(pick(r, "ticket_id", "id"));
const ticketNo = (r: Row) => text(pick(r, "ticket_no", "ticket_code"), ticketId(r) ? `#${ticketId(r)}` : "—");

/** "Raise a support ticket" form → createSupportTicket. */
export function TicketForm({ onCreated }: { onCreated?: () => void }) {
  const user = useSession()?.user;
  const toast = useToast();
  const [f, setF] = useState({ subject: "", area: TICKET_AREAS[0].value, severity: TICKET_SEVERITIES[0].value, details: "", contact_name: "", contact_phone: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.subject.trim()) return toast.show("Enter a subject");
    setSaving(true);
    try {
      const res = await api.createSupportTicket({ ...f, subject: f.subject.trim(), contact_name: f.contact_name.trim() || user?.name || "", contact_phone: f.contact_phone.trim() || user?.phone || "" });
      toast.show(`Ticket ${text(pick(res, "ticket_no", "ticket_id", "id"), "")} created — we’ll respond shortly`.replace("  ", " "));
      setF({ ...f, subject: "", details: "" });
      onCreated?.();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Could not create the ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form className="grid gap-4 px-5 pb-5 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Subject" required className="sm:col-span-2">
          <Input placeholder="Briefly describe the issue" value={f.subject} onChange={set("subject")} />
        </Field>
        <Field label="Area">
          <Select value={f.area} onChange={set("area")}>
            {TICKET_AREAS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Severity">
          <Select value={f.severity} onChange={set("severity")}>
            {TICKET_SEVERITIES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Contact name">
          <Input placeholder={user?.name} value={f.contact_name} onChange={set("contact_name")} />
        </Field>
        <Field label="Contact phone">
          <Input placeholder={user?.phone ?? "+91"} value={f.contact_phone} onChange={set("contact_phone")} />
        </Field>
        <Field label="Details" className="sm:col-span-2">
          <Textarea placeholder="Steps to reproduce, screenshots, complaint IDs…" className="min-h-28" value={f.details} onChange={set("details")} />
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Send />} Submit ticket
          </Button>
        </div>
      </form>
      {toast.node}
    </>
  );
}

/** The signed-in user's tickets (getMyTickets), paged from the UI. */
export function MyTickets({ refreshKey = 0 }: { refreshKey?: number }) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const list = useApi(() => api.getMyTickets({ status, page, limit }), [status, page, limit, refreshKey]);
  const rows = rowsOf(list.data?.data);

  return (
    <Card>
      <CardHeader
        title="My tickets"
        icon={Wrench}
        action={
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-8 w-32 py-0 text-xs">
            <option value="">All</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        }
      />
      {list.loading && <ListSkeleton rows={3} />}
      {list.error && <EmptyState icon={TriangleAlert} title="Could not load tickets" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}
      {list.data && rows.length === 0 && <NoData />}
      <ul className="space-y-2 px-5 pb-4">
        {rows.map((t, i) => {
          const s = text(pick(t, "status"), "").toLowerCase();
          return (
            <li key={ticketId(t) ?? i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-slate-400">{ticketNo(t)}</p>
                <p className="truncate text-[13px] font-semibold text-slate-800">{text(pick(t, "subject"))}</p>
              </div>
              <Badge className={statusTone(s)}>{s || "—"}</Badge>
            </li>
          );
        })}
      </ul>
      {list.data && <Pager page={page} limit={limit} total={list.data.pagination?.total} totalPages={list.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />}
    </Card>
  );
}

/** All tickets with filters (adminGetTickets). Only Super Admin gets the status update (updateTicketStatus). */
export function AdminTickets({ canUpdate = false }: { canUpdate?: boolean }) {
  const toast = useToast();
  const [f, setF] = useState({ status: "", severity: "", area: "", search: "", from_date: "", to_date: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const list = useApi(() => api.adminGetTickets({ ...applied, page, limit }), [JSON.stringify(applied), page, limit]);
  const rows = rowsOf(list.data?.data);

  const [edit, setEdit] = useState<Row | null>(null);
  const [status, setStatus] = useState("resolved");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    const id = edit && ticketId(edit);
    if (!id) return;
    setSaving(true);
    try {
      await api.updateTicketStatus(id, status, note.trim());
      toast.show(`${ticketNo(edit)} marked ${status}`);
      setEdit(null);
      list.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Could not update the ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="All support tickets" subtitle={canUpdate ? "Filter, then update a ticket’s status" : "Admin view — filter and review tickets"} icon={Wrench} />
      <form
        className="grid gap-3 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setApplied(f);
        }}
      >
        <Select value={f.status} onChange={set("status")}>
          <option value="">All statuses</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={f.severity} onChange={set("severity")}>
          <option value="">All severities</option>
          {TICKET_SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>{s.value}</option>
          ))}
        </Select>
        <Select value={f.area} onChange={set("area")}>
          <option value="">All areas</option>
          {TICKET_AREAS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={f.search} onChange={set("search")} placeholder="Search" className="pl-9" />
        </div>
        <Input type="date" value={f.from_date} onChange={set("from_date")} aria-label="From date" />
        <Input type="date" value={f.to_date} onChange={set("to_date")} aria-label="To date" />
        <Button type="submit" className="sm:col-span-2 lg:col-span-1"><Search /> Search</Button>
      </form>

      {list.loading && <ListSkeleton rows={3} />}
      {list.error && <EmptyState icon={TriangleAlert} title="Could not load tickets" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}
      {list.data && rows.length === 0 && <NoData />}
      <ul className="space-y-2 px-5 pb-4">
        {rows.map((t, i) => {
          const s = text(pick(t, "status"), "").toLowerCase();
          return (
            <li key={ticketId(t) ?? i} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-slate-400">{ticketNo(t)} · {text(pick(t, "area"))} · {text(pick(t, "severity"))}</p>
                <p className="truncate text-[13px] font-semibold text-slate-800">{text(pick(t, "subject"))}</p>
                <p className="truncate text-xs text-slate-500">{text(pick(t, "contact_name", "raised_by_name", "user_name"))} · {timeText(pick(t, "created_at"))}</p>
              </div>
              <Badge className={statusTone(s)}>{s || "—"}</Badge>
              {canUpdate && <Button variant="secondary" size="sm" onClick={() => { setEdit(t); setStatus(s === "resolved" ? "open" : "resolved"); setNote(""); }}>Update</Button>}
            </li>
          );
        })}
      </ul>
      {list.data && <Pager page={page} limit={limit} total={list.data.pagination?.total} totalPages={list.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `Update ${ticketNo(edit)}` : "Update ticket"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
            <Button disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Status" required>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Note">
            <Textarea placeholder="What was done?" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
      {toast.node}
    </Card>
  );
}
