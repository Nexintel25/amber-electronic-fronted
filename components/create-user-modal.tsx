"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import { ADMINS, PMS, SITES, USERS, VENDORS } from "@/lib/data";
import { PARENT_ROLE, type UserRoleLabel } from "@/lib/roles";
import { Button, Field, Input, Select } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

/** Candidate managers for a new user of the given role (the role directly above it in the hierarchy). */
export function managersFor(role: UserRoleLabel): string[] {
  switch (PARENT_ROLE[role]) {
    case "Super Admin":
      return USERS.filter((u) => u.role === "Super Admin").map((u) => u.name);
    case "Admin":
      return ADMINS.map((a) => a.name);
    case "Project Manager":
      return PMS.map((p) => p.name);
    case "Vendor":
      return VENDORS.map((v) => v.contact);
    default:
      return [];
  }
}

/**
 * Create-user dialog that enforces the reporting chain:
 * Super Admin → Admin → Project Manager → Vendor → Worker (Complaint Creators report to an Admin).
 * `allowedRoles` is what the signed-in panel may create; `fixedManager` pre-selects "reports to" for panels that only manage their own people.
 */
export function CreateUserModal({
  open,
  onClose,
  allowedRoles,
  defaultRole,
  fixedManager,
}: {
  open: boolean;
  onClose: () => void;
  allowedRoles: UserRoleLabel[];
  defaultRole?: UserRoleLabel;
  fixedManager?: string;
}) {
  const toast = useToast();
  const [role, setRole] = useState<UserRoleLabel>(defaultRole ?? allowedRoles[0]);
  const parent = PARENT_ROLE[role];
  const managers = managersFor(role);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Add ${role.toLowerCase()}`}
        description="An invite with a secure sign-in link will be sent by email."
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                onClose();
                toast.show(`${role} invited — they will report to ${fixedManager ?? "the selected manager"}`);
              }}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required><Input placeholder="e.g. Pooja Negi" /></Field>
          <Field label="Phone"><Input placeholder="+91" /></Field>
          <Field label="Email" required className="sm:col-span-2"><Input type="email" placeholder="name@company.com" /></Field>
          <Field label="Role" required>
            <Select value={role} onChange={(e) => setRole(e.target.value as UserRoleLabel)} disabled={allowedRoles.length === 1}>
              {allowedRoles.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Site" required>
            <Select>{SITES.map((s) => <option key={s.id}>{s.name}</option>)}</Select>
          </Field>
          {parent && (
            <Field label={`Reports to (${parent})`} required className="sm:col-span-2">
              <Select defaultValue={fixedManager} disabled={!!fixedManager} key={role}>
                {(fixedManager ? [fixedManager] : managers).map((m) => <option key={m}>{m}</option>)}
              </Select>
            </Field>
          )}
          {role === "Vendor" && (
            <Field label="Vendor company" required className="sm:col-span-2"><Input placeholder="e.g. PowerGrid Services" /></Field>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 sm:col-span-2">
            <Network className="mt-0.5 size-4 text-slate-500" />
            <p className="text-[13px] text-slate-600">
              Chain of command: <b>Super Admin → Admin → Project Manager → Vendor → Worker</b>. Each level creates and manages the level directly below it.
            </p>
          </div>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
