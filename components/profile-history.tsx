"use client";

import { useState } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { api, fmtDate, type ProfileHistoryRow } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Button, EmptyState, ListSkeleton, NoDataRow, td, th } from "@/components/ui";
import { Pager } from "@/components/pager";
import { UserAvatar } from "@/components/user-avatar";

const FIELD_LABEL: Record<string, string> = { name: "Name", phone: "Phone", email: "Email", photo: "Profile photo" };

/** One side of a change: a thumbnail for photos, otherwise the text. */
function Value({ row, v }: { row: ProfileHistoryRow; v: string | null }) {
  if (row.field_name === "photo") return v ? <UserAvatar name="Photo" src={v} size="sm" /> : <span className="text-xs text-slate-400">No photo</span>;
  return <span className={cn("text-[13px]", v ? "text-slate-800" : "text-slate-400")}>{v || "—"}</span>;
}

/** Profile change history (profile/history): When | What changed | Old → New | Changed by | IP. Super Admin only. */
export function ProfileHistory({ userId }: { userId?: number }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const list = useApi(() => api.getProfileHistory({ page, limit, user_id: userId }), [page, limit, userId]);
  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;

  if (list.error) return <EmptyState icon={TriangleAlert} title="Could not load the history" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />;
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/70">
            <tr>
              <th className={th}>When</th>
              <th className={th}>What changed</th>
              <th className={th}>Old → New</th>
              <th className={th}>Changed by</th>
              <th className={th}>IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.loading && (
              <tr><td colSpan={5} className="p-4"><ListSkeleton rows={3} className="rounded-none shadow-none ring-0" /></td></tr>
            )}
            {!list.loading && rows.length === 0 && <NoDataRow cols={5} />}
            {!list.loading &&
              rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className={cn(td, "text-xs text-slate-500")}>{fmtDate(r.created_at)}</td>
                  <td className={cn(td, "font-semibold text-slate-800")}>{FIELD_LABEL[r.field_name] ?? r.field_name}</td>
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      <Value row={r} v={r.old_value} />
                      <ArrowRight className="size-3.5 shrink-0 text-slate-400" />
                      <Value row={r} v={r.new_value} />
                    </span>
                  </td>
                  <td className={cn(td, "text-[13px]")}>{r.changed_by_name || "—"}</td>
                  <td className={cn(td, "font-mono text-xs text-slate-500")}>{r.ip_address || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <Pager page={page} limit={limit} total={total} totalPages={Math.max(1, Math.ceil(total / limit))} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />}
    </>
  );
}

