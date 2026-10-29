"use client";

import type { ReactNode } from "react";
import type { RoleKey } from "@/lib/roles";
import { roleKeyFromApi } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useRole } from "@/components/shell/app-shell";

/** Renders `children` only for the listed roles; everyone else sees `fallback`. */
export function RoleGate({ roles, children, fallback = null }: { roles: RoleKey[]; children: ReactNode; fallback?: ReactNode }) {
  const role = useRole();
  return <>{roles.includes(role) ? children : fallback}</>;
}

/** True when the signed-in user is a Complaint Creator — the only role that may raise complaints. */
export function useIsCreator(): boolean {
  const role = useSession()?.user.role;
  return !!role && roleKeyFromApi(role) === "creator";
}

/** Renders `children` (e.g. a "Raise Complaint" button) for Complaint Creators only. */
export function CreatorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <>{useIsCreator() ? children : fallback}</>;
}
