import { WorkerTaskLoader } from "@/components/worker-task";

export default async function WorkerTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkerTaskLoader id={id} />;
}
