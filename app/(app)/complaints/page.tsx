import { FilePlus } from "lucide-react";
import { COMPLAINTS } from "@/lib/data";
import { ComplaintsTable } from "@/components/complaints-table";
import { LinkButton, PageHeader } from "@/components/ui";

export default function ComplaintsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Complaint Register"
        title="All Complaints"
        description="Every complaint across sites with its current workflow stage, owner, priority and SLA."
        actions={
          <LinkButton href="/creator/new">
            <FilePlus /> Raise Complaint
          </LinkButton>
        }
      />
      <ComplaintsTable complaints={COMPLAINTS} />
    </>
  );
}
