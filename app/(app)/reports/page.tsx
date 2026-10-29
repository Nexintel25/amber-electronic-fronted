import { PageHeader, EmptyState } from "@/components/ui";
import { ReportViewer } from "@/components/report-viewer";
import { RoleGate } from "@/components/role-gate";
import { Lock } from "lucide-react";

/** Shared by every role except the Worker. */
export default function ReportsPage() {
  return (
    <RoleGate
      roles={["creator", "vendor", "pm", "admin", "superadmin"]}
      fallback={<EmptyState icon={Lock} title="Reports are not available" text="Workers do not have access to reports." />}
    >
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        description="Choose a report type, narrow it by date and vendor, then search. Download the result as PDF or Excel."
      />
      <ReportViewer />
    </RoleGate>
  );
}
