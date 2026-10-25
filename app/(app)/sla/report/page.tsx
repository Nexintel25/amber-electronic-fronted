import { PageHeader } from "@/components/ui";
import { ReportViewer } from "@/components/report-viewer";

export default function SlaReportPage() {
  return (
    <>
      <PageHeader
        eyebrow="SLA reporting"
        title="SLA report"
        description="Filter by date and vendor, search, then download the SLA report as PDF or Excel."
      />
      <ReportViewer types={["sla"]} />
    </>
  );
}
