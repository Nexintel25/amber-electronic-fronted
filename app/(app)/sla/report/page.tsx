"use client";

import { ArrowLeft } from "lucide-react";
import { LinkButton, PageHeader } from "@/components/ui";
import { ReportViewer } from "@/components/report-viewer";
import { useSlaScope } from "@/components/sla-scope";

export default function SlaReportPage() {
  const scope = useSlaScope();
  return (
    <>
      <PageHeader
        eyebrow={`SLA tracking · ${scope.label}`}
        title="SLA report"
        description="Filter by date and vendor, search, then download the SLA report as PDF or Excel."
        actions={
          <LinkButton href="/sla" variant="secondary">
            <ArrowLeft /> SLA tracker
          </LinkButton>
        }
      />
      <ReportViewer types={["sla"]} vendors={scope.vendors} scoped={scope.scoped} />
    </>
  );
}
