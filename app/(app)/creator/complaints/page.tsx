import { FilePlus } from "lucide-react";
import { COMPLAINTS } from "@/lib/data";
import { ComplaintsTable } from "@/components/complaints-table";
import { LinkButton, PageHeader } from "@/components/ui";

const MINE = ["Rohit Mehra", "Anjali Verma"];

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
      <ComplaintsTable complaints={COMPLAINTS.filter((c) => MINE.includes(c.raisedBy))} showSite={false} />
    </>
  );
}
