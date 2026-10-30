"use client";

import { TriangleAlert } from "lucide-react";
import { api, toComplaint } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { ComplaintsTable } from "@/components/complaints-table";
import { Button, EmptyState, ListSkeleton } from "@/components/ui";

/** Loads the signed-in user's complaints from the API and renders them in the shared table. */
export function ComplaintsLoader({ showSite = true }: { showSite?: boolean }) {
  const { data, error, loading, reload } = useApi(async () => (await api.getComplaints({ limit: 200 })).data.map(toComplaint));

  if (loading) return <ListSkeleton rows={6} />;
  if (error) return <EmptyState icon={TriangleAlert} title="Could not load complaints" text={error} action={<Button onClick={reload}>Try again</Button>} />;
  return <ComplaintsTable complaints={data ?? []} showSite={showSite} />;
}
