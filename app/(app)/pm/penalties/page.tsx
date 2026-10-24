import { PMS } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ReportViewer } from "@/components/report-viewer";

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel"
        title="Penalty report"
        description="Late complaints for the vendors you are responsible for. Filter by date and vendor, then download."
      />
      <ReportViewer types={["penalty"]} vendors={(PMS[0]?.vendors ?? [])} scoped={true} />
    </>
  );
}
