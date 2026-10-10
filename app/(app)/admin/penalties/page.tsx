import { allPenalties } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PenaltyReport } from "@/components/penalty-report";

export default function AdminPenalties() {
  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Penalty report"
        description="Every vendor that has not closed a complaint within 15 days of it being raised, with the per-day penalty levied or still accruing."
      />
      <PenaltyReport penalties={allPenalties()} scopeLabel="All vendors" />
    </>
  );
}
