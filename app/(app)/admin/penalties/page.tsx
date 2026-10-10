import { VENDORS } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ReportViewer } from "@/components/report-viewer";

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Penalty report"
        description="Vendors that have not closed a complaint within 15 days of it being raised, with the per-day penalty. Filter by date and vendor, then download."
      />
      <ReportViewer types={["penalty"]} vendors={VENDORS.map((v) => v.name)} scoped={false} />
    </>
  );
}
