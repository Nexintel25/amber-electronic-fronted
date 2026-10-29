import { FilePlus } from "lucide-react";
import { ComplaintsLoader } from "@/components/complaints-loader";
import { LinkButton, PageHeader } from "@/components/ui";
import { CreatorOnly } from "@/components/role-gate";

export default function ComplaintsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Complaint Register"
        title="All Complaints"
        description="Every Amber complaint with its current workflow stage, owner, priority and SLA."
        actions={
          <CreatorOnly>
            <LinkButton href="/creator/new">
              <FilePlus /> Raise Complaint
            </LinkButton>
          </CreatorOnly>
        }
      />
      <ComplaintsLoader />
    </>
  );
}
