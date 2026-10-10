import { PMS, allPenalties } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PenaltyReport } from "@/components/penalty-report";

const ME = PMS[0];

export default function PMPenalties() {
  const mine = allPenalties().filter((p) => ME.vendors.includes(p.complaint.vendor ?? ""));
  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel"
        title="Penalty report"
        description="Late complaints for the vendors you are responsible for. A vendor that has not closed a complaint within 15 days is charged per extra day."
      />
      <PenaltyReport penalties={mine} scopeLabel={`${ME.name}’s vendors`} />
    </>
  );
}
