"use client";

import { useState } from "react";
import { Eye, Gavel, FileSpreadsheet, FileText, FileSearch, Loader2, Search, TriangleAlert, X } from "lucide-react";
import { STATUS_META, type StatusKey } from "@/lib/workflow";
import { api, apiStatusOf, pick, rowsOf, summaryOf, num, text, timeText, type Row } from "@/lib/api";
import { downloadExcel, downloadPdf, type ReportResult } from "@/lib/report-export";
import { useRole } from "@/components/shell/app-shell";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { Button, Card, EmptyState, Field, Input, ListSkeleton, Select, Textarea, td, th } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { Pager } from "@/components/pager";

export type ReportKey = "register" | "satisfaction" | "benchmark" | "penalty";

export const REPORT_TYPES: { key: ReportKey; label: string; hint: string }[] = [
  { key: "register", label: "Complaint register", hint: "Month-wise register of every complaint" },
  { key: "satisfaction", label: "Satisfaction report", hint: "Creator feedback on closed complaints, month-wise" },
  { key: "benchmark", label: "Benchmark report", hint: "Vendor benchmark for the month" },
  { key: "penalty", label: "Penalty report", hint: "Vendors past the 15-day window" },
];
const STATUS_OPTIONS: StatusKey[] = ["new", "vendor_review", "worker_assigned", "in_progress", "pending_verification", "rework", "closed", "rejected"];
const MONTHLY: ReportKey[] = ["register", "satisfaction", "benchmark"];

type Filters = { type: ReportKey; from: string; to: string; month: string; vendorId: string; categoryId: string; status: string; q: string };
type Table = { name: string; ids: (number | undefined)[]; waived: boolean[]; columns: string[]; rows: string[][] };
type Loaded = { tables: Table[]; summary: { label: string; value: string }[]; total?: number; totalPages?: number; meta: string; title: string };

const EMPTY: Filters = { type: "register", from: "", to: "", month: new Date().toISOString().slice(0, 7), vendorId: "", categoryId: "", status: "ALL", q: "" };
/** Columns shown inline; the rest are opened with the row’s View button. */
const MAX_COLS = 6;
/** Columns the Penalty report does not show. */
const HIDDEN_PENALTY = /^penalty_?status$|waive/i;
/** Raw database keys (complaint_id, vendor_id, building_id, category_id…) mean nothing to a reader; the name / number columns carry the same information. */
const RAW_ID = /(^|_)id$/i;
/** Turns snake_case values such as `worker_assigned` into “Worker Assigned”; other text is left alone. */
const clean = (v: string) => (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(v) ? v.replace(/_/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase()) : v);
const label = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Filter → search → data table → PDF / Excel, loaded from `getPenaltyReport`.
 * Page and page size are chosen in the UI and sent with every request. `types` limits the report-type dropdown.
 */
export function ReportViewer({ types }: { types?: ReportKey[] }) {
  const typeOptions = REPORT_TYPES.filter((r) => !types || types.includes(r.key));
  const own = useSession()?.user.vendor_id ?? null;
  const [form, setForm] = useState<Filters>({ ...EMPTY, type: typeOptions[0].key });
  // Loads the default report as soon as the page opens.
  const [applied, setApplied] = useState<Filters | null>(() => ({ ...EMPTY, type: typeOptions[0].key, vendorId: own ? String(own) : "" }));
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [view, setView] = useState<{ columns: string[]; row: string[] } | null>(null);
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const toast = useToast();
  const isAdmin = useRole() === "admin";
  const [waive, setWaive] = useState<{ id: number } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [waiving, setWaiving] = useState(false);
  const vendors = useApi(() => api.getVendors());
  const categories = useApi(() => api.getComplaintCategories());

  const vendorId = own ? String(own) : form.vendorId;
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setForm((f) => ({ ...f, [k]: v }));
  const invalid = !!form.from && !!form.to && form.from > form.to;

  const report = useApi<Loaded | null>(async () => {
    if (!applied) return null;
    const vid = applied.vendorId ? Number(applied.vendorId) : undefined;
    const monthly = MONTHLY.includes(applied.type);
    const res =
      applied.type === "register"
        ? await api.getComplaintRegisterReport({ month: applied.month, vendor_id: vid, search: applied.q, status: applied.status, category_id: applied.categoryId ? Number(applied.categoryId) : undefined, page, limit })
        : applied.type === "satisfaction"
          ? await api.getSatisfactionReport({ month: applied.month, vendor_id: vid })
          : applied.type === "benchmark"
            ? await api.getBenchmarkReport({ month: applied.month, vendor_id: vid })
            : await api.getPenaltyReport({ report_type: applied.type, from_date: applied.from, to_date: applied.to, vendor_id: vid, search: applied.q, page, limit });
    // Satisfaction and benchmark put their sections (by_vendor, feedbacks…) at the top level of the response, with no `data` wrapper.
    const src: unknown = res.data ?? res;
    const isWaived = (r: Row) => Object.entries(r).some(([k, v]) => /waive/i.test(k) && ["1", "true", "yes"].includes(String(v).toLowerCase()));
    const toTable = (name: string, list: Row[]): Table => {
      const columns = Array.from(new Set(list.flatMap((r) => Object.keys(r).filter((k) => typeof r[k] !== "object" || r[k] === null)))).filter((k) => !RAW_ID.test(k) && (applied.type !== "penalty" || !HIDDEN_PENALTY.test(k)));
      return { name, ids: list.map((r) => num(pick(r, "complaint_id"))), waived: list.map(isWaived), columns: columns.map(label), rows: list.map((r) => columns.map((c) => clean(timeText(pick(r, c))))) };
    };
    const sections = applied.type === "satisfaction" || applied.type === "benchmark" ? Object.entries(src as Row).filter(([, v]) => Array.isArray(v)) : [];
    const tables = sections.length ? sections.map(([k, v]) => toTable(label(k), v as Row[])) : [toTable("", rowsOf(src))];
    const sum = summaryOf(src);
    const def = REPORT_TYPES.find((r) => r.key === applied.type);
    const vendorName = vendors.data?.find((v) => String(v.id) === applied.vendorId)?.company_name;
    const range = monthly ? applied.month : applied.from || applied.to ? `${applied.from || "start"} to ${applied.to || "today"}` : "All dates";
    return {
      tables,
      title: def?.label ?? "Report",
      summary: [{ label: "Records", value: String(res.pagination?.total ?? tables[0].rows.length) }, ...(sum ? Object.entries(sum).filter(([k, v]) => typeof v !== "object" && !RAW_ID.test(k) && k !== "month").map(([k, v]) => ({ label: label(k), value: text(v) })) : [])],
      total: res.pagination?.total,
      totalPages: res.pagination?.total_pages,
      meta: `${range} · ${vendorName ?? "All vendors"}${applied.q ? ` · search “${applied.q}”` : ""} · generated ${new Date().toLocaleString("en-IN")}`,
    };
  }, [applied, page, limit]);

  const run = () => {
    if (invalid) return;
    setPage(1);
    setApplied({ ...form, vendorId });
  };

  const reset = () => {
    const fresh = { ...EMPTY, type: typeOptions[0].key };
    setForm(fresh);
    setApplied({ ...fresh, vendorId: own ? String(own) : "" });
    setPage(1);
  };

  const result = report.data;
  const download = async (kind: "pdf" | "xlsx") => {
    if (!result) return;
    const data: ReportResult = { title: result.title, sections: result.tables.map((t) => ({ name: t.name, columns: t.columns, rows: t.rows })), summary: result.summary };
    setBusy(kind);
    try {
      await (kind === "pdf" ? downloadPdf : downloadExcel)(data, result.meta);
    } catch {
      toast.show("Could not create the file — please try again");
    } finally {
      setBusy(null);
    }
  };

  const canWaive = isAdmin && applied?.type === "penalty";
  const submitWaive = async () => {
    if (!waive) return;
    setWaiving(true);
    try {
      await api.waiveFine(waive.id, remarks.trim());
      toast.show("Fine waived");
      setWaive(null);
      report.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Could not waive the fine");
    } finally {
      setWaiving(false);
    }
  };

  const hint = typeOptions.find((r) => r.key === form.type)?.hint;

  return (
    <>
      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1.2fr]"
        >
          <Field label="Report type" required hint={hint}>
            <Select value={form.type} disabled={typeOptions.length === 1} onChange={(e) => set("type", e.target.value as ReportKey)}>
              {typeOptions.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </Select>
          </Field>
          {MONTHLY.includes(form.type) ? (
            <Field label="Month" className="md:col-span-2 xl:col-span-2">
              <Input type="month" value={form.month} onChange={(e) => set("month", e.target.value)} />
            </Field>
          ) : (
            <>
              <Field label="From date">
                <Input type="date" value={form.from} onChange={(e) => set("from", e.target.value)} />
              </Field>
              <Field label="To date" hint={invalid ? "“To” must be after “From”" : undefined}>
                <Input type="date" value={form.to} onChange={(e) => set("to", e.target.value)} className={invalid ? "border-rose-400" : undefined} />
              </Field>
            </>
          )}
          <Field label="Vendor">
            <Select value={vendorId} disabled={!!own} onChange={(e) => set("vendorId", e.target.value)}>
              {!own && <option value="">All vendors</option>}
              {vendors.data?.map((v) => (
                <option key={v.id} value={v.id}>{v.company_name}</option>
              ))}
            </Select>
          </Field>
          {form.type === "register" && (
            <>
              <Field label="Complaint type">
                <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                  <option value="">All types</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="ALL">All statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={apiStatusOf(s)}>{STATUS_META[s].label}</option>
                  ))}
                </Select>
              </Field>
            </>
          )}
          <div className="relative md:col-span-2 xl:col-span-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={form.q} onChange={(e) => set("q", e.target.value)} placeholder="Search within the report — complaint ID, title, worker, site…" className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={invalid}>
              <Search /> Search
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              <X /> Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        {!applied ? (
          <EmptyState icon={FileSearch} title="No report yet" text="Pick a report type, set the date range and vendor, then press Search to load the data table." />
        ) : report.loading ? (
          <ListSkeleton rows={6} />
        ) : report.error || !result ? (
          <EmptyState icon={TriangleAlert} title="Could not load the report" text={report.error ?? "No response."} action={<Button onClick={report.reload}>Try again</Button>} />
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[15px] font-semibold text-slate-900">{result.title}</p>
                <p className="text-xs text-slate-500">{result.meta}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {result.summary.map((s) => (
                  <span key={s.label} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200/70">
                    {s.label}: <b className="text-slate-900">{s.value}</b>
                  </span>
                ))}
                <Button variant="secondary" size="sm" disabled={!result.tables.some((t) => t.rows.length) || busy !== null} onClick={() => download("xlsx")}>
                  <FileSpreadsheet /> {busy === "xlsx" ? "Preparing…" : "Excel"}
                </Button>
                <Button variant="secondary" size="sm" disabled={!result.tables.some((t) => t.rows.length) || busy !== null} onClick={() => download("pdf")}>
                  <FileText /> {busy === "pdf" ? "Preparing…" : "PDF"}
                </Button>
              </div>
            </div>
            {result.tables.map((t) => {
              const cap = result.tables.length > 1 ? t.columns.length : MAX_COLS;
              return (
                <div key={t.name}>
                  {t.name && <p className="border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-sm font-semibold text-slate-800">{t.name} <span className="text-xs font-normal text-slate-400">{t.rows.length}</span></p>}
                {t.rows.length === 0 ? (
                  <EmptyState icon={FileSearch} title="No data found" text="No records for these filters." />
                ) : (
                  <div className="max-h-[560px] overflow-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr>
                          {t.columns.slice(0, cap).map((c) => (
                            <th key={c} className={th}>{c}</th>
                          ))}
                          {(t.columns.length > cap || canWaive) && <th className={th} />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {t.rows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            {r.slice(0, cap).map((cell, j) => (
                              <td key={j} className={td}>{cell}</td>
                            ))}
                            {(r.length > cap || canWaive) && (
                              <td className={td}>
                                <div className="flex gap-2">
                                  {r.length > cap && <Button variant="secondary" size="sm" onClick={() => setView({ columns: t.columns, row: r })}><Eye /> View</Button>}
                                  {canWaive && t.ids[i] !== undefined && (
                                    <Button variant="secondary" size="sm" disabled={t.waived[i]} onClick={() => { setRemarks(""); setWaive({ id: t.ids[i]! }); }}>
                                      <Gavel /> {t.waived[i] ? "Waived" : "Waive fine"}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                </div>
              );
            })}
            <Pager page={page} limit={limit} total={result.total} totalPages={result.totalPages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />
          </>
        )}
      </Card>
      <Modal open={!!view} onClose={() => setView(null)} title={result?.title ?? "Details"} description="Full record" size="lg" footer={<Button variant="secondary" onClick={() => setView(null)}>Close</Button>}>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {view?.columns.map((c, i) => (
            <div key={c} className="min-w-0">
              <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{c}</dt>
              <dd className="text-sm break-words text-slate-800">{view.row[i]}</dd>
            </div>
          ))}
        </dl>
      </Modal>
      <Modal
        open={!!waive}
        onClose={() => setWaive(null)}
        title="Waive fine"
        description="The vendor will no longer be fined for this complaint."
        footer={
          <>
            <Button variant="secondary" onClick={() => setWaive(null)}>Cancel</Button>
            <Button disabled={waiving || !remarks.trim()} onClick={submitWaive}>
              {waiving ? <Loader2 className="animate-spin" /> : <Gavel />} Waive fine
            </Button>
          </>
        }
      >
        <Field label="Reason" required>
          <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Why is the fine being waived?" />
        </Field>
      </Modal>
      {toast.node}
    </>
  );
}
