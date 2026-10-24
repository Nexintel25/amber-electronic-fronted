"use client";

import { PMS, VENDORS } from "@/lib/data";
import type { RoleKey } from "@/lib/roles";
import { useRole } from "@/components/shell/app-shell";

const MY_VENDOR = "";

/**
 * Which vendors' SLA data a role may see: a vendor only their own company, a PM only the vendors they are
 * responsible for. The creator and the Admin / Super Admin see every vendor.
 */
export function slaScopeFor(role: RoleKey): { vendors: string[]; scoped: boolean; label: string } {
  if (role === "vendor") return { vendors: [MY_VENDOR], scoped: true, label: "My company" };
  if (role === "pm") return { vendors: (PMS[0]?.vendors ?? []), scoped: true, label: `${(PMS[0]?.name ?? "Project Manager")}’s vendors` };
  return { vendors: VENDORS.map((v) => v.name), scoped: false, label: "All vendors" };
}

export function useSlaScope() {
  return slaScopeFor(useRole());
}
