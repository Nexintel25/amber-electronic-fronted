import { call, currentUserId, get, post } from "./client";
import type { AppNotification, MyProfile } from "./types";

export const getMyProfile = () => post<MyProfile>("products/getMyProfile", { user_id: currentUserId() });

/** Returns `unread_count` and `pagination` alongside the list, so callers get the full envelope. */
export const getNotifications = (f: { filter?: "all" | "unread"; page?: number; limit?: number } = {}) =>
  call<AppNotification[]>("products/getNotifications", { user_id: currentUserId(), filter: "all", page: 1, limit: 20, ...f });

/** Marks one notification as read, or every unread one when `notificationId` is omitted. */
export const markNotificationsRead = (notificationId?: number) =>
  post<{ marked_count: number; unread_count: number }>("products/markNotificationsRead", { user_id: currentUserId(), ...(notificationId ? { notification_id: notificationId } : {}) });

/* ------------------------------ Profile edit ------------------------------ */

/**
 * Only the fields the user changed. `photo` is the picture itself as a JPEG data URL
 * (`data:image/jpeg;base64,…`, the same format as complaint photos); `photo: ""` removes it.
 */
export type ProfileChanges = Partial<{ name: string; phone: string; email: string; photo: string }>;
export type ProfileHistoryRow = {
  field_name: "name" | "phone" | "email" | "photo" | string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  changed_by_name: string | null;
  ip_address: string | null;
};

/** Step 1: mails a 6-digit code to the user's current email. */
export const requestProfileEdit = (changes: ProfileChanges) => post<unknown>("profile/edit/request", changes);

/** Step 2: applies the changes with the code; returns the updated user. */
export const confirmProfileEdit = (otp: string) =>
  post<{ user_id: number; name: string; email: string; phone: string | null; profile_photo: string | null }>("profile/edit/confirm", { otp });

/** Newest first. Super Admin / Admin may pass `user_id` to see another user's history. */
export const getProfileHistory = (f: { page: number; limit: number; user_id?: number }) =>
  get<{ total: number; rows: ProfileHistoryRow[] }>(`profile/history?page=${f.page}&limit=${f.limit}${f.user_id ? `&user_id=${f.user_id}` : ""}`);
