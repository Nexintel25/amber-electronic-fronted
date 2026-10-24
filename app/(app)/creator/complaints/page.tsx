import { FilePlus } from "lucide-react";
import { ComplaintsLoader } from "@/components/complaints-loader";
import { LinkButton, PageHeader } from "@/components/ui";

export default function MyComplaintsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Complaint Creator Portal"
        title="Track My Complaints"
        description="Follow each complaint you raised through all 8 workflow stages — from review to verified closure."
        actions={
          <LinkButton href="/creator/new">
            <FilePlus /> Raise Complaint
          </LinkButton>
        }
      />
      <ComplaintsLoader showSite={false} />
    </>
  );
}
