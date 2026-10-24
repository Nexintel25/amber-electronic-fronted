import { FilePlus } from "lucide-react";
import { ComplaintsLoader } from "@/components/complaints-loader";
import { LinkButton, PageHeader } from "@/components/ui";

export default function ComplaintsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Complaint Register"
        title="All Complaints"
        description="Every Amber complaint with its current workflow stage, owner, priority and SLA."
        actions={
          <LinkButton href="/creator/new">
            <FilePlus /> Raise Complaint
          </LinkButton>
        }
      />
      <ComplaintsLoader />
    </>
  );
}
