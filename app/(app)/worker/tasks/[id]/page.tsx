import { notFound } from "next/navigation";
import { COMPLAINTS, getComplaint } from "@/lib/data";
import { WorkerTask } from "@/components/worker-task";

export function generateStaticParams() {
  return COMPLAINTS.map((c) => ({ id: c.id }));
}

export default async function WorkerTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getComplaint(id);
  if (!c) notFound();
  return <WorkerTask complaint={c} />;
}
