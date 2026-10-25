import { call, currentUserId, post } from "./client";
import type { Row } from "./shape";

export type TicketInput = { subject: string; area: string; severity: string; details: string; contact_name: string; contact_phone: string };

export const createSupportTicket = (t: TicketInput) => post<Row>("complaints/createSupportTicket", { user_id: currentUserId(), ...t });

/** The signed-in user's own tickets. Returns the envelope so callers can read `pagination`. */
export const getMyTickets = (f: { status?: string; page: number; limit: number }) =>
  call<Row[]>("complaints/getMyTickets", { user_id: currentUserId(), ...clean(f) });

/** Admin view of everyone's tickets. */
export const adminGetTickets = (f: { status?: string; severity?: string; area?: string; search?: string; from_date?: string; to_date?: string; page: number; limit: number }) =>
  call<Row[]>("complaints/adminGetTickets", { user_id: currentUserId(), ...clean(f) });

export const updateTicketStatus = (ticketId: number, status: string, note: string) =>
  post<Row>("complaints/updateTicketStatus", { user_id: currentUserId(), ticket_id: ticketId, status, note });

/** Drops empty filters so "All" does not reach the server as an empty string. */
function clean<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v !== undefined && v !== null)) as Partial<T>;
}
