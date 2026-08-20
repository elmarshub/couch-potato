"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/functional/empty-state";
import { getImageUrl, formatRelativeTime } from "@/lib/format";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "../queries";

export function NotificationsList() {
  const { data: notifications, isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const hasUnread = notifications?.some((n) => !n.isRead) ?? false;

  if (isLoading) {
    return <p className="text-gray-400 text-sm">Loading...</p>;
  }

  if (!notifications || notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        message="When a new movie is added to theaters, you'll see it here."
        actionLabel="Browse theater"
        actionHref="/theater"
      />
    );
  }

  return (
    <div>
      {hasUnread && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="border-white/20 hover:bg-white/10 text-white"
          >
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={`/movies/${notification.tmdbMovieId}/book`}
            onClick={() => {
              if (!notification.isRead) markReadMutation.mutate(notification.id);
            }}
            className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-colors"
          >
            <div className="relative w-14 h-20 flex-shrink-0 rounded overflow-hidden">
              <Image
                src={getImageUrl(notification.moviePosterPath, "w200")}
                alt={notification.movieTitle}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">
                {notification.movieTitle} is now showing
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {formatRelativeTime(notification.createdAt)}
              </p>
            </div>
            {!notification.isRead && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
