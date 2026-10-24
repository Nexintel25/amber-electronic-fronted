"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";

/** Sends signed-out visitors to /login. Renders nothing until the stored session has been read. */
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (!session)
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  return <>{children}</>;
}
