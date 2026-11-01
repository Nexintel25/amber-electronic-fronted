"use client";

import { Fragment, useState } from "react";
import { AlarmClock, ChevronDown, Loader2, Search, Send, TriangleAlert, Wrench } from "lucide-react";
import { api, num, pick, rowsOf, text, timeText, type Row } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, ListSkeleton, NoData, NoDataRow, Select, Textarea, td, th } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { Pager } from "@/components/pager";
import { cn } from "@/lib/utils";

/** `value` is the backend's `area` enum. */
export const TICKET_AREAS = [
  { value: "web_dashboard", label: "Web dashboard" },
  { value: "worker_app", label: "Worker mobile app" },
  { value: "reports", label: "Reports" },
  { value: "notifications", label: "Notifications" },
  { value: "account_access", label: "Account access / login" },
  { value: "other", label: "Other" },
];
/** `value` is the backend's `severity` enum. */
export const TICKET_SEVERITIES = [
  { value: "low", label: "Low — question" },
  { value: "medium", label: "Medium — feature not working" },
  { value: "high", label: "High — blocking my work" },
  { value: "critical", label: "Critical — platform down" },
];
/** Statuses a ticket can be set to. */
export const TICKET_STATUSES = ["open", "in_progress", "resolved"];
/** Filter values: "pending" = open + in progress. */
const FILTER_STATUSES = ["pending", ...TICKET_STATUSES];
const statusLabel = (s: string) => (s ? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—");

const EMPTY_TICKET = { subject: "", area: TICKET_AREAS[0].value, severity: TICKET_SEVERITIES[0].value, details: "", contact_name: "", contact_phone: "" };

/** Readable label for a stored area / severity value (the severity label without its "— …" hint). */
const areaLabel = (v: unknown) => TICKET_AREAS.find((a) => a.value === v)?.label ?? text(v);
const severityLabel = (v: unknown) => TICKET_SEVERITIES.find((s) => s.value === v)?.label.split(" — ")[0] ?? text(v);

const statusTone = (s: string) =>
  s === "resolved" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : s === "open" ? "bg-sky-50 text-sky-700 ring-sky-600/15" : "bg-amber-50 text-amber-700 ring-amber-600/20";
const severityTone: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 ring-slate-500/15",
  medium: "bg-sky-50 text-sky-700 ring-sky-600/15",
  high: "bg-amber-50 text-amber-700 ring-amber-600/20",
  critical: "bg-rose-50 text-rose-700 ring-rose-600/15",
};
const roleLabel = (v: unknown) => text(v, "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
/** `minutes_open` as "2m", "3h 5m" or "2d 4h". */
const ageText = (v: unknown) => {
  const m = num(v);
  if (m === undefined) return "—";
  return m >= 1440 ? `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h` : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

const ticketId = (r: Row) => num(pick(r, "ticket_id", "id"));
const ticketNo = (r: Row) => text(pick(r, "ticket_no", "ticket_code"), ticketId(r) ? `#${ticketId(r)}` : "—");

/** "Raise a support ticket" form → createSupportTicket. */
export function TicketForm({ onCreated }: { onCreated?: () => void }) {
  const user = useSession()?.user;
  const toast = useToast();
  const [f, setF] = useState(EMPTY_TICKET);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.subject.trim()) return toast.show("Enter a subject");
    setSaving(true);
    try {
      const res = await api.createSupportTicket({ ...f, subject: f.subject.trim(), contact_name: f.contact_name.trim() || user?.name || "", contact_phone: f.contact_phone.trim() || user?.phone || "" });
      toast.show(`Ticket ${text(pick(res, "ticket_no", "ticket_id", "id"), "")} created — we’ll respond shortly`.replace("  ", " "));
      setF(EMPTY_TICKET);
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
            {FILTER_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
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
              <Badge className={statusTone(s)}>{statusLabel(s)}</Badge>
            </li>
          );
        })}
      </ul>
      {list.data && <Pager page={page} limit={limit} total={list.data.pagination?.total} totalPages={list.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />}
    </Card>
  );
}

/** All tickets with filters (adminGetTickets), showing every field. Only Super Admin gets the status update (updateTicketStatus). */
export function AdminTickets({ canUpdate = false }: { canUpdate?: boolean }) {
  const toast = useToast();
  const [f, setF] = useState({ status: "", severity: "", area: "", search: "", from_date: "", to_date: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const list = useApi(() => api.adminGetTickets({ ...applied, page, limit }), [JSON.stringify(applied), page, limit]);
  const rows = rowsOf(list.data?.data);
  const tabs = (list.data as unknown as { tabs?: Row } | null)?.tabs;
  const [openRow, setOpenRow] = useState<number | null>(null);

  const [edit, setEdit] = useState<Row | null>(null);
  const [status, setStatus] = useState("resolved");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  /** Summary tiles filter by status (or critical + pending) straight away. */
  const quickFilter = (next: Partial<typeof f>) => {
    const v = { ...f, status: "", severity: "", ...next };
    setF(v);
    setApplied(v);
    setPage(1);
  };

  const save = async () => {
    const id = edit && ticketId(edit);
    if (!id) return;
    setSaving(true);
    try {
      await api.updateTicketStatus(id, status, note.trim());
      toast.show(`${ticketNo(edit)} marked ${statusLabel(status).toLowerCase()}`);
      setEdit(null);
      setNote("");
      list.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Could not update the ticket");
    } finally {
      setSaving(false);
    }
  };

  const tiles = [
    { label: "Pending", key: "pending_count", filter: { status: "pending" }, tone: "text-amber-700" },
    { label: "Open", key: "open_count", filter: { status: "open" }, tone: "text-sky-700" },
    { label: "In progress", key: "in_progress_count", filter: { status: "in_progress" }, tone: "text-amber-700" },
    { label: "Resolved", key: "resolved_count", filter: { status: "resolved" }, tone: "text-emerald-700" },
    { label: "Critical pending", key: "critical_pending", filter: { status: "pending", severity: "critical" }, tone: "text-rose-700" },
  ];

  return (
    <Card>
      <CardHeader title="All support tickets" subtitle={canUpdate ? "Filter, open a ticket for every detail, update its status" : "Admin view — filter and review tickets"} icon={Wrench} />

      {tabs && (
        <div className="grid grid-cols-2 gap-2 px-5 pb-4 sm:grid-cols-5">
          {tiles.map((t) => {
            const on = applied.status === t.filter.status && applied.severity === (t.filter.severity ?? "");
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => quickFilter(on ? {} : t.filter)}
                className={cn("rounded-xl border p-3 text-left transition", on ? "border-brand-400 bg-brand-50 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50")}
              >
                <p className="text-xs font-medium text-slate-500">{t.label}</p>
                <p className={cn("mt-1 text-2xl font-bold tabular-nums", t.tone)}>{text(tabs[t.key], "0")}</p>
              </button>
            );
          })}
        </div>
      )}

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
          {FILTER_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </Select>
        <Select value={f.severity} onChange={set("severity")}>
          <option value="">All severities</option>
          {TICKET_SEVERITIES.map((s) => (
            <option key={s.value} value={s.value}>{severityLabel(s.value)}</option>
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

      {list.error && <EmptyState icon={TriangleAlert} title="Could not load tickets" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}
      {!list.error && (
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Ticket</th>
                <th className={th}>Subject & details</th>
                <th className={th}>Raised by</th>
                <th className={th}>Contact</th>
                <th className={th}>Area</th>
                <th className={th}>Severity</th>
                <th className={th}>Status</th>
                <th className={th}>Raised</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.loading && (
                <tr><td colSpan={9} className="p-4"><ListSkeleton rows={3} className="rounded-none shadow-none ring-0" /></td></tr>
              )}
              {!list.loading && rows.length === 0 && <NoDataRow cols={9} />}
              {!list.loading &&
                rows.map((t, i) => {
                  const s = text(pick(t, "status"), "").toLowerCase();
                  const sev = text(pick(t, "severity"), "").toLowerCase();
                  const ackOverdue = Number(pick(t, "ack_overdue")) === 1;
                  const expanded = openRow === i;
                  const raisedBy = text(pick(t, "raised_by_name", "user_name"));
                  return (
                    <Fragment key={ticketId(t) ?? i}>
                      <tr className={cn("align-top hover:bg-slate-50/60", ackOverdue && "bg-rose-50/30")}>
                        <td className={td}>
                          <p className="font-mono text-xs font-bold text-brand-700">{ticketNo(t)}</p>
                          {ackOverdue && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                              <AlarmClock className="size-3" /> Ack overdue
                            </span>
                          )}
                        </td>
                        <td className={cn(td, "max-w-[300px] whitespace-normal")}>
                          <p className="text-[13px] font-semibold text-slate-800">{text(pick(t, "subject"))}</p>
                          <p className="line-clamp-2 text-xs text-slate-500">{text(pick(t, "details"))}</p>
                        </td>
                        <td className={td}>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={raisedBy} size="xs" />
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800">{raisedBy}</p>
                              <p className="text-[11px] text-slate-500">{text(pick(t, "raised_by_email"), "")}</p>
                              <p className="text-[11px] text-slate-500">
                                {roleLabel(pick(t, "raised_by_role")) || "—"}
                                {pick(t, "vendor_name") !== undefined && ` · ${text(pick(t, "vendor_name"))}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={td}>
                          <p className="text-[13px] text-slate-800">{text(pick(t, "contact_name"))}</p>
                          <p className="font-mono text-[11px] text-slate-500">{text(pick(t, "contact_phone"), "")}</p>
                        </td>
                        <td className={cn(td, "text-[13px]")}>{areaLabel(pick(t, "area"))}</td>
                        <td className={td}><Badge className={severityTone[sev] ?? severityTone.low}>{severityLabel(sev)}</Badge></td>
                        <td className={td}><Badge className={statusTone(s)}>{statusLabel(s)}</Badge></td>
                        <td className={td}>
                          <p className="text-xs text-slate-700">{timeText(pick(t, "created_at"))}</p>
                          {s !== "resolved" && <p className="text-[11px] text-slate-500">open {ageText(pick(t, "minutes_open"))}</p>}
                        </td>
                        <td className={cn(td, "text-right")}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setOpenRow(expanded ? null : i)} aria-expanded={expanded}>
                              Details <ChevronDown className={cn("transition", expanded && "rotate-180")} />
                            </Button>
                            {canUpdate && (
                              <Button variant="secondary" size="sm" onClick={() => { setEdit(t); setStatus(s === "resolved" ? "open" : s === "open" ? "in_progress" : "resolved"); setNote(""); }}>
                                Update
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={9} className="px-4 py-4">
                            <TicketDetails t={t} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
      {list.data && <Pager page={page} limit={limit} total={list.data.pagination?.total} totalPages={list.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `Update ${ticketNo(edit)}` : "Update ticket"}
        description={edit ? text(pick(edit, "subject")) : undefined}
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
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Note" hint="Saved as the resolution note.">
            <Textarea placeholder="What was done?" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </Modal>
      {toast.node}
    </Card>
  );
}

/** Every field of one ticket, grouped: the request, who raised it, and its timeline. */
function TicketDetails({ t }: { t: Row }) {
  const groups: { title: string; items: [string, React.ReactNode][] }[] = [
    {
      title: "Ticket",
      items: [
        ["Ticket no", ticketNo(t)],
        ["Ticket ID", text(pick(t, "ticket_id"))],
        ["Subject", text(pick(t, "subject"))],
        ["Area", areaLabel(pick(t, "area"))],
        ["Severity", severityLabel(pick(t, "severity"))],
        ["Status", statusLabel(text(pick(t, "status"), ""))],
      ],
    },
    {
      title: "Raised by",
      items: [
        ["Name", text(pick(t, "raised_by_name"))],
        ["User ID", text(pick(t, "raised_by_id"))],
        ["Email", text(pick(t, "raised_by_email"))],
        ["Role", roleLabel(pick(t, "raised_by_role")) || "—"],
        ["Vendor", text(pick(t, "vendor_name"))],
        ["Contact name", text(pick(t, "contact_name"))],
        ["Contact phone", text(pick(t, "contact_phone"))],
      ],
    },
    {
      title: "Timeline",
      items: [
        ["Raised at", timeText(pick(t, "created_at"))],
        ["Open for", ageText(pick(t, "minutes_open"))],
        ["Acknowledgement", Number(pick(t, "ack_overdue")) === 1 ? "Overdue" : "On time"],
        ["In progress at", timeText(pick(t, "in_progress_at"))],
        ["Resolved at", timeText(pick(t, "resolved_at"))],
        ["Resolved by", text(pick(t, "resolved_by_name"))],
      ],
    },
  ];
  return (
    <div className="space-y-4 rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Details</p>
        <p className="mt-1 text-[13px] whitespace-pre-wrap text-slate-800">{text(pick(t, "details"))}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {groups.map((g) => (
          <dl key={g.title}>
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{g.title}</p>
            {g.items.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-slate-100 py-1.5 text-[13px] last:border-0">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium break-all text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Resolution note</p>
        <p className="mt-1 text-[13px] whitespace-pre-wrap text-slate-800">{text(pick(t, "resolution_note"))}</p>
      </div>
    </div>
  );
}
