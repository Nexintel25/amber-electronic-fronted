import { PageHeader } from "@/components/ui";
import { ReportViewer } from "@/components/report-viewer";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Reports"
        description="Choose a report type, narrow it by date and vendor, then search. Download the result as PDF or Excel."
      />
      <ReportViewer />
    </>
  );
}
