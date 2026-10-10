"use client";

import type { ReactNode } from "react";
import type { RoleKey } from "@/lib/roles";
import { useRole } from "@/components/shell/app-shell";

/** Renders `children` only for the listed roles; everyone else sees `fallback`. */
export function RoleGate({ roles, children, fallback = null }: { roles: RoleKey[]; children: ReactNode; fallback?: ReactNode }) {
  const role = useRole();
  return <>{roles.includes(role) ? children : fallback}</>;
}
