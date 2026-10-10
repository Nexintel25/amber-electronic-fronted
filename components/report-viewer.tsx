"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, FileSearch, Search, X } from "lucide-react";
import { REPORT_TYPES, buildReport, type ReportFilters, type ReportKey, type ReportResult } from "@/lib/reports";
import { downloadExcel, downloadPdf } from "@/lib/report-export";
import { Button, Card, EmptyState, Field, Input, Select, td, th } from "@/components/ui";
import { useToast } from "@/components/interactive";

const EMPTY: ReportFilters = { type: "complaints", from: "", to: "", vendor: "", q: "" };

/**
 * Filter → search → data table → PDF / Excel. Shared by the Reports page and every penalty report page.
 * `types` limits the report-type dropdown, `vendors` limits the vendor dropdown (and the data) to the user's own vendors.
 */
export function ReportViewer({ types, vendors, scoped = false }: { types?: ReportKey[]; vendors: string[]; scoped?: boolean }) {
  const typeOptions = REPORT_TYPES.filter((r) => !types || types.includes(r.key));
  const [form, setForm] = useState<ReportFilters>({ ...EMPTY, type: typeOptions[0].key });
  const [result, setResult] = useState<{ data: ReportResult; meta: string } | null>(null);
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const toast = useToast();

  const set = <K extends keyof ReportFilters>(k: K, v: ReportFilters[K]) => setForm((f) => ({ ...f, [k]: v }));
  const invalid = !!form.from && !!form.to && form.from > form.to;

  const run = () => {
    if (invalid) return;
    const range = form.from || form.to ? `${form.from || "start"} to ${form.to || "today"}` : "All dates";
    const meta = `${range} · ${form.vendor || "All vendors"}${form.q ? ` · search “${form.q}”` : ""} · generated ${new Date().toLocaleString("en-IN")}`;
    setResult({ data: buildReport(form, scoped ? vendors : undefined), meta });
  };

  const reset = () => {
    setForm({ ...EMPTY, type: typeOptions[0].key });
    setResult(null);
  };

  const download = async (kind: "pdf" | "xlsx") => {
    if (!result) return;
    setBusy(kind);
    try {
      await (kind === "pdf" ? downloadPdf : downloadExcel)(result.data, result.meta);
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
            <Select value={form.type} disabled={typeOptions.length === 1} onChange={(e) => set("type", e.target.value as ReportFilters["type"])}>
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
            <Select value={form.vendor} onChange={(e) => set("vendor", e.target.value)}>
              {(!scoped || vendors.length > 1) && <option value="">All vendors</option>}
              {vendors.map((v) => (
                <option key={v}>{v}</option>
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
        {result ? (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[15px] font-semibold text-slate-900">{result.data.title}</p>
                <p className="text-xs text-slate-500">{result.meta}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {result.data.summary.map((s) => (
                  <span key={s.label} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200/70">
                    {s.label}: <b className="text-slate-900">{s.value}</b>
                  </span>
                ))}
                <Button variant="secondary" size="sm" disabled={!result.data.rows.length || busy !== null} onClick={() => download("xlsx")}>
                  <FileSpreadsheet /> {busy === "xlsx" ? "Preparing…" : "Excel"}
                </Button>
                <Button variant="secondary" size="sm" disabled={!result.data.rows.length || busy !== null} onClick={() => download("pdf")}>
                  <FileText /> {busy === "pdf" ? "Preparing…" : "PDF"}
                </Button>
              </div>
            </div>
            {result.data.rows.length === 0 ? (
              <EmptyState icon={FileSearch} title="No records found" text="Nothing matches these filters. Widen the date range, pick another vendor or clear the search." />
            ) : (
              <div className="max-h-[560px] overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      {result.data.columns.map((c) => (
                        <th key={c} className={th}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.data.rows.map((r, i) => (
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
          </>
        ) : (
          <EmptyState icon={FileSearch} title="No report yet" text="Pick a report type, set the date range and vendor, then press Search to load the data table." />
        )}
      </Card>
      {toast.node}
    </>
  );
}
