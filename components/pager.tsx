"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Select } from "@/components/ui";

export const LIMIT_OPTIONS = [10, 20, 50, 100];

type Props = { page: number; limit: number; total?: number; totalPages?: number; onPage: (p: number) => void; onLimit: (l: number) => void };

/** Page + page-size controls. The parent owns `page`/`limit` and refetches when they change. */
export function Pager({ page, limit, total, totalPages, onPage, onLimit }: Props) {
  const last = totalPages ?? (total != null ? Math.max(1, Math.ceil(total / limit)) : undefined);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span>{total != null ? `${total} record${total === 1 ? "" : "s"}` : "—"}</span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          Rows
          <Select value={limit} onChange={(e) => onLimit(Number(e.target.value))} className="h-8 w-20 py-0 text-xs">
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </label>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="tabular-nums">Page {page}{last ? ` of ${last}` : ""}</span>
        <Button variant="secondary" size="sm" disabled={last != null && page >= last} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
