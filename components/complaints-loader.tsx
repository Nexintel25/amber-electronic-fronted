"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { api, toComplaint } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { ComplaintsTable } from "@/components/complaints-table";
import { Button, EmptyState } from "@/components/ui";

/** Loads the signed-in user's complaints from the API and renders them in the shared table. */
export function ComplaintsLoader({ showSite = true }: { showSite?: boolean }) {
  const { data, error, loading, reload } = useApi(async () => (await api.getComplaints({ limit: 200 })).data.map(toComplaint));

  if (loading)
    return (
      <div className="grid place-items-center py-24 text-slate-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  if (error) return <EmptyState icon={TriangleAlert} title="Could not load complaints" text={error} action={<Button onClick={reload}>Try again</Button>} />;
  return <ComplaintsTable complaints={data ?? []} showSite={showSite} />;
}
