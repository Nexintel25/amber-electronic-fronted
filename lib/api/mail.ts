import { get, post, put } from "./client";
import type { Row } from "./shape";

/** A sender identity for outgoing email; buildings are mapped to one so each client's mail carries its own brand. */
export type MailProfile = {
  code: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  /** Prefix of the server's SMTP env variables for this profile (e.g. RITES → RITES_SMTP_HOST …). */
  env_prefix: string | null;
  is_default: boolean;
  is_active: boolean;
};

/** Super Admin: every mail profile (and, if the server sends them, its buildings). */
export const getMailProfiles = () => get<unknown>("admin/mail-profiles");

/** Super Admin: creates the profile, or updates the one with the same `code`. */
export const saveMailProfile = (p: MailProfile) => put<Row>("admin/mail-profiles", p);

/** Super Admin: sends mail for these buildings from the given profile. */
export const assignMailProfile = (buildingIds: number[], profileCode: string) =>
  post<unknown>("admin/mail-profiles/assign", { building_ids: buildingIds, profile_code: profileCode });

/** The signed-in user's email notification preference. */
export const getEmailNotifications = () => get<unknown>("me/email-notifications");
export const setEmailNotifications = (enabled: boolean) => put<unknown>("me/email-notifications", { enabled });
