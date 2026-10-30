import { call, currentUserId, post } from "./client";
import type { AppNotification, MyProfile } from "./types";

export const getMyProfile = () => post<MyProfile>("products/getMyProfile", { user_id: currentUserId() });

/** Returns `unread_count` and `pagination` alongside the list, so callers get the full envelope. */
export const getNotifications = (f: { filter?: "all" | "unread"; page?: number; limit?: number } = {}) =>
  call<AppNotification[]>("products/getNotifications", { user_id: currentUserId(), filter: "all", page: 1, limit: 20, ...f });

/** Marks one notification as read, or every unread one when `notificationId` is omitted. */
export const markNotificationsRead = (notificationId?: number) =>
  post<{ marked_count: number; unread_count: number }>("products/markNotificationsRead", { user_id: currentUserId(), ...(notificationId ? { notification_id: notificationId } : {}) });
