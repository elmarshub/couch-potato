import { http } from "@/lib/http";
import type { Notification } from "./types";

export function fetchNotifications() {
  return http.get<Notification[]>("/api/notifications");
}

export function fetchUnreadCount() {
  return http.get<{ count: number }>("/api/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return http.post<{ ok: true }>("/api/notifications/read", { id });
}

export function markAllNotificationsRead() {
  return http.post<{ ok: true }>("/api/notifications/read", { all: true });
}
