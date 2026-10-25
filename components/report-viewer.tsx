"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, FileSearch, Loader2, Search, TriangleAlert, X } from "lucide-react";
import { api, pick, rowsOf, summaryOf, text, type Row } from "@/lib/api";
import { downloadExcel, downloadPdf, type ReportResult } from "@/lib/report-export";
import { useSession } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { Button, Card, EmptyState, Field, Input, Select, td, th } from "@/components/ui";
import { useToast } from "@/components/interactive";
import { Pager } from "@/components/pager";

export type ReportKey = "complaints" | "sla" | "daily" | "vendor" | "worker" | "photo" | "penalty";

export const REPORT_TYPES: { key: ReportKey; label: string; hint: string }[] = [
  { key: "complaints", label: "Complaint report", hint: "Every complaint with status, vendor and age" },
  { key: "sla", label: "SLA report", hint: "Time left or overdue against each priority’s resolution target" },
  { key: "daily", label: "Daily report", hint: "Complaints raised, closed and open per day" },
  { key: "vendor", label: "Vendor performance report", hint: "Volume, rework, turnaround and SLA per vendor" },
  { key: "worker", label: "Worker productivity report", hint: "Jobs, speed and photo compliance per worker" },
  { key: "photo", label: "Photo report", hint: "Before/after photo sets with GPS check" },
  { key: "penalty", label: "Penalty report", hint: "Vendors past the 15-day window" },
];

type Filters = { type: ReportKey; from: string; to: string; vendorId: string; q: string };
type Loaded = { columns: string[]; rows: string[][]; summary: { label: string; value: string }[]; total?: number; totalPages?: number; meta: string; title: string };

const EMPTY: Filters = { type: "complaints", from: "", to: "", vendorId: "", q: "" };
const label = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Filter → search → data table → PDF / Excel, loaded from `getPenaltyReport`.
 * Page and page size are chosen in the UI and sent with every request. `types` limits the report-type dropdown.
 */
export function ReportViewer({ types }: { types?: ReportKey[] }) {
  const typeOptions = REPORT_TYPES.filter((r) => !types || types.includes(r.key));
  const own = useSession()?.user.vendor_id ?? null;
  const [form, setForm] = useState<Filters>({ ...EMPTY, type: typeOptions[0].key });
  const [applied, setApplied] = useState<Filters | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const toast = useToast();
  const vendors = useApi(() => api.getVendors());

  const vendorId = own ? String(own) : form.vendorId;
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setForm((f) => ({ ...f, [k]: v }));
  const invalid = !!form.from && !!form.to && form.from > form.to;

  const report = useApi<Loaded | null>(async () => {
    if (!applied) return null;
    const res = await api.getPenaltyReport({
      report_type: applied.type,
      from_date: applied.from,
      to_date: applied.to,
      vendor_id: applied.vendorId ? Number(applied.vendorId) : undefined,
      search: applied.q,
      page,
      limit,
    });
    const list = rowsOf(res.data);
    const columns = Array.from(new Set(list.flatMap((r) => Object.keys(r).filter((k) => typeof r[k] !== "object" || r[k] === null))));
    const sum = summaryOf(res.data);
    const def = REPORT_TYPES.find((r) => r.key === applied.type);
    const vendorName = vendors.data?.find((v) => String(v.id) === applied.vendorId)?.company_name;
    const range = applied.from || applied.to ? `${applied.from || "start"} to ${applied.to || "today"}` : "All dates";
    return {
      title: def?.label ?? "Report",
      columns: columns.map(label),
      rows: list.map((r: Row) => columns.map((c) => text(pick(r, c)))),
      summary: [{ label: "Records", value: String(res.pagination?.total ?? list.length) }, ...(sum ? Object.entries(sum).filter(([, v]) => typeof v !== "object").map(([k, v]) => ({ label: label(k), value: text(v) })) : [])],
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
    setForm({ ...EMPTY, type: typeOptions[0].key });
    setApplied(null);
    setPage(1);
  };

  const result = report.data;
  const download = async (kind: "pdf" | "xlsx") => {
    if (!result) return;
    const data: ReportResult = { title: result.title, columns: result.columns, rows: result.rows, summary: result.summary };
    setBusy(kind);
    try {
      await (kind === "pdf" ? downloadPdf : downloadExcel)(data, result.meta);
    } catch {
      toast.show("Could not create the file — please try again");
    } finally {
      setBusy(null);
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
          <Field label="From date">
            <Input type="date" value={form.from} onChange={(e) => set("from", e.target.value)} />
          </Field>
          <Field label="To date" hint={invalid ? "“To” must be after “From”" : undefined}>
            <Input type="date" value={form.to} onChange={(e) => set("to", e.target.value)} className={invalid ? "border-rose-400" : undefined} />
          </Field>
          <Field label="Vendor">
            <Select value={vendorId} disabled={!!own} onChange={(e) => set("vendorId", e.target.value)}>
              {!own && <option value="">All vendors</option>}
              {vendors.data?.map((v) => (
                <option key={v.id} value={v.id}>{v.company_name}</option>
              ))}
            </Select>
          </Field>
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
          <div className="grid place-items-center py-16 text-slate-400"><Loader2 className="size-6 animate-spin" /></div>
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
                <Button variant="secondary" size="sm" disabled={!result.rows.length || busy !== null} onClick={() => download("xlsx")}>
                  <FileSpreadsheet /> {busy === "xlsx" ? "Preparing…" : "Excel"}
                </Button>
                <Button variant="secondary" size="sm" disabled={!result.rows.length || busy !== null} onClick={() => download("pdf")}>
                  <FileText /> {busy === "pdf" ? "Preparing…" : "PDF"}
                </Button>
              </div>
            </div>
            {result.rows.length === 0 ? (
              <EmptyState icon={FileSearch} title="No data found" text="No records for these filters." />
            ) : (
              <div className="max-h-[560px] overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      {result.columns.map((c) => (
                        <th key={c} className={th}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        {r.map((cell, j) => (
                          <td key={j} className={td}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager page={page} limit={limit} total={result.total} totalPages={result.totalPages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />
          </>
        )}
      </Card>
      {toast.node}
    </>
  );
}
