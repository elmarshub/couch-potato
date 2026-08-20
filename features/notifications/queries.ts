"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuthContext } from "@/providers/auth-provider";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";
import type { Notification } from "./types";

export function useNotificationsQuery() {
  const { isAuthenticated } = useAuthContext();
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: fetchNotifications,
    enabled: isAuthenticated,
    staleTime: 1000 * 15,
  });
}

export function useUnreadCountQuery() {
  const { isAuthenticated } = useAuthContext();
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: fetchUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 1000 * 15,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id: string) => {
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.list(),
        (prev) =>
          prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      queryClient.setQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
        (prev) =>
          prev ? { count: Math.max(0, prev.count - 1) } : prev
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.list(),
        (prev) => prev?.map((n) => ({ ...n, isRead: true }))
      );
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
        count: 0,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
