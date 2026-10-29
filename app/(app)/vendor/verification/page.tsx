"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Flag, Loader2, RotateCcw, Search, TriangleAlert } from "lucide-react";
import { api, num, pick, rowsOf, text, timeText, type Row } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { workerView } from "@/lib/vendor-workers";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, NoData, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal, Tabs, useToast } from "@/components/interactive";
import { Pager } from "@/components/pager";

type Photo = { url: string; type: string; cycle: number; name: string };

const GROUPS = [
  { type: "initial", label: "Complaint photos", hint: "Raised by the creator" },
  { type: "before", label: "Before work", hint: "Taken by the worker at check-in" },
  { type: "after", label: "After work", hint: "Taken by the worker on completion" },
];

/** Photos on a verification row, from `media` (type: initial / before / after), oldest first. */
function photosOf(r: Row): Photo[] {
  const list = Array.isArray(r.media) ? (r.media as Row[]) : [];
  return list
    .map((m) => ({ url: text(pick(m, "file_url", "url"), ""), type: text(pick(m, "type", "phase"), "other").toLowerCase(), cycle: num(pick(m, "cycle")) ?? 0, name: text(pick(m, "file_name"), ""), id: num(pick(m, "media_id")) ?? 0 }))
    .filter((p) => p.url)
    .sort((a, b) => a.cycle - b.cycle || a.id - b.id);
}

export default function VerificationPage() {
  const session = useSession();
  const vendorId = session?.user.vendor_id ?? null;
  const toast = useToast();

  const [view, setView] = useState<"pending" | "rework">("pending");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [building, setBuilding] = useState("");
  const [worker, setWorker] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const buildings = useApi(() => api.getBuildings());
  const workers = useApi(async () => (vendorId ? (await api.getVendorWorkers(vendorId)).map(workerView) : []), [vendorId]);
  const list = useApi(
    () => api.getVendorVerificationList({ view, search, building_id: building ? Number(building) : undefined, worker_id: worker ? Number(worker) : undefined, page, limit }),
    [view, search, building, worker, page, limit],
  );

  const items = rowsOf(list.data?.data);
  const counts = (list.data as unknown as { tabs?: { pending_count?: number; rework_count?: number } } | null)?.tabs;
  const idOf = (r: Row) => num(pick(r, "complaint_id", "id"));

  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [rework, setRework] = useState<Row | null>(null);
  const [reason, setReason] = useState("");
  const [reworkWorker, setReworkWorker] = useState("");

  const approve = async (r: Row) => {
    const id = idOf(r);
    if (!id) return;
    setBusy(id);
    try {
      await api.vendorApprove(id, remarks[id] ?? "");
      toast.show(`${text(pick(r, "complaint_no"), `#${id}`)} verified & closed`);
      list.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Could not approve");
    } finally {
      setBusy(null);
    }
  };

  const sendRework = async () => {
    const id = rework && idOf(rework);
    if (!id || !reason.trim() || !reworkWorker) return;
    setBusy(id);
    try {
      await api.vendorRework(id, reason.trim(), Number(reworkWorker));
      toast.show(`${text(pick(rework, "complaint_no"), `#${id}`)} sent for rework`);
      setRework(null);
      list.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Could not send for rework");
    } finally {
      setBusy(null);
    }
  };

  const openRework = (r: Row) => {
    setRework(r);
    setReason("");
    setReworkWorker(String(num(pick(r, "worker_id")) ?? ""));
  };

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel · Verification"
        title="Verify & rework"
        description="Photos uploaded by your workers land here (and with the Admin). If the Admin raises an issue, only you see it. Verify and close — or send the job back to a worker for rework."
      />

      <Tabs
        className="mb-4 w-fit"
        value={view}
        onChange={(v) => { setView(v); setPage(1); }}
        tabs={[
          { value: "pending", label: "Pending verification", count: counts?.pending_count },
          { value: "rework", label: "Rework", count: counts?.rework_count },
        ]}
      />

      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search complaint, title, worker" className="pl-9" />
        </div>
        <Select value={building} onChange={(e) => { setBuilding(e.target.value); setPage(1); }} className="w-52">
          <option value="">All sites</option>
          {buildings.data?.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select value={worker} onChange={(e) => { setWorker(e.target.value); setPage(1); }} className="w-52">
          <option value="">All workers</option>
          {workers.data?.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
        <Button type="submit"><Search /> Search</Button>
      </form>

      {list.loading && (
        <div className="grid place-items-center py-20 text-slate-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}
      {list.error && <EmptyState icon={TriangleAlert} title="Could not load the list" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}
      {list.data && items.length === 0 && (
        <Card>
          <NoData />
        </Card>
      )}

      {items.length > 0 && (
        <div className="space-y-6">
          {items.map((r, i) => {
            const id = idOf(r);
            const no = text(pick(r, "complaint_no"), id ? `#${id}` : "—");
            const photos = photosOf(r);
            const issue = pick(r, "admin_issue", "issue", "issue_text", "issue_remarks");
            const reworkReason = pick(r, "rework_reason");
            const workerName = text(pick(r, "worker_name"));
            return (
              <Card key={id ?? i} className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/complaints/${id}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">{no}</Link>
                      <Badge className="bg-orange-50 text-orange-700 ring-orange-600/20">{issue ? "Issue raised by Admin" : "Photos submitted"}</Badge>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{text(pick(r, "title"))}</h3>
                    <p className="text-[13px] text-slate-500">{text(pick(r, "building_name"))} · {text(pick(r, "area_location"))}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar name={workerName === "—" ? "W" : workerName} />
                    <div className="text-[13px]">
                      <p className="font-semibold text-slate-800">{workerName}</p>
                      <p className="text-slate-500">Submitted {timeText(pick(r, "submitted_at", "updated_at"))}</p>
                    </div>
                  </div>
                </div>

                {reworkReason != null && (
                  <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50/60 px-5 py-3.5">
                    <RotateCcw className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-900">Sent for rework <span className="font-normal text-amber-700/80">· {timeText(pick(r, "rework_sent_at"))}</span></p>
                      <p className="mt-0.5 text-amber-900/90">{text(reworkReason)}</p>
                    </div>
                  </div>
                )}

                {issue != null && (
                  <div className="flex items-start gap-3 border-b border-fuchsia-100 bg-fuchsia-50/60 px-5 py-3.5">
                    <Flag className="mt-0.5 size-4 shrink-0 text-fuchsia-600" />
                    <div className="text-sm">
                      <p className="font-semibold text-fuchsia-900">Issue from Admin <span className="font-normal text-fuchsia-700/80">· only you and the Admin can see this</span></p>
                      <p className="mt-0.5 text-fuchsia-900/90">{text(issue)}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    {photos.length === 0 ? (
                      <NoData className="rounded-xl border border-dashed border-slate-200 py-10" />
                    ) : (
                      <div className="space-y-5">
                        {GROUPS.map((g) => {
                          const set = photos.filter((p) => p.type === g.type);
                          if (set.length === 0) return null;
                          return (
                            <section key={g.type}>
                              <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                {g.label} <span className="font-medium tracking-normal text-slate-400 normal-case">· {set.length} · {g.hint}</span>
                              </p>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {set.map((p, k) => (
                                  <a key={k} href={p.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-slate-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.url} alt={`${g.label} ${k + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:opacity-90" />
                                    <span className="block truncate px-2 py-1 text-[11px] text-slate-500">{p.cycle > 0 ? `Rework ${p.cycle} · ` : ""}{p.name || `Photo ${k + 1}`}</span>
                                  </a>
                                ))}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">Worker’s completion note</p>
                      <p className="mt-1 text-sm text-slate-700">{text(pick(r, "submit_note", "worker_note", "note", "completion_note"))}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Field label="Closure remarks">
                      <Textarea
                        placeholder="Root cause, parts replaced, recommendations…"
                        value={(id && remarks[id]) || ""}
                        onChange={(e) => id && setRemarks({ ...remarks, [id]: e.target.value })}
                      />
                    </Field>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" disabled={busy === id} onClick={() => openRework(r)}>
                        <RotateCcw /> Rework
                      </Button>
                      <Button variant="success" className="flex-1" disabled={busy === id} onClick={() => approve(r)}>
                        {busy === id ? <Loader2 className="animate-spin" /> : <BadgeCheck />} Verify & close
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {list.data && (
        <Card className="mt-6">
          <Pager page={page} limit={limit} total={list.data.pagination?.total} totalPages={list.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />
        </Card>
      )}

      <Modal
        open={!!rework}
        onClose={() => setRework(null)}
        title="Send for rework"
        description="The complaint goes back to the chosen worker. The 15-day clock keeps running."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRework(null)}>Cancel</Button>
            <Button variant="danger" disabled={!reason.trim() || !reworkWorker || busy !== null} onClick={sendRework}>Send for rework</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Worker" required>
            <Select value={reworkWorker} onChange={(e) => setReworkWorker(e.target.value)}>
              <option value="">Select worker</option>
              {workers.data?.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Reason" required>
            <Textarea placeholder="Describe what needs to be redone…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
