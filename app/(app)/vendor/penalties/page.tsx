import { PageHeader } from "@/components/ui";
import { ReportViewer } from "@/components/report-viewer";

const VENDOR = "PowerGrid Services";

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel · PowerGrid Services"
        title="Penalty report"
        description="Complaints must be closed within 15 days of being raised; late jobs are charged per extra day. Filter by date, then download."
      />
      <ReportViewer types={["penalty"]} vendors={[VENDOR]} scoped={true} />
    </>
  );
}
