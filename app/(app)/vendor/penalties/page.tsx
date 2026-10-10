import { allPenalties } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PenaltyReport } from "@/components/penalty-report";

const VENDOR = "PowerGrid Services";

export default function VendorPenalties() {
  const mine = allPenalties().filter((p) => p.complaint.vendor === VENDOR);
  return (
    <>
      <PageHeader
        eyebrow={`Vendor Panel · ${VENDOR}`}
        title="My penalties"
        description="Complaints must be closed within 15 days of being raised. Late jobs are charged per extra day — close them quickly to stop the clock."
      />
      <PenaltyReport penalties={mine} scopeLabel={VENDOR} showVendor={false} />
    </>
  );
}
