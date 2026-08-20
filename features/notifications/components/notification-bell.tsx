"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl, formatRelativeTime } from "@/lib/format";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadCountQuery,
} from "../queries";
import type { Notification } from "../types";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { data: unreadCount } = useUnreadCountQuery();
  const { data: notifications, isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const count = unreadCount?.count ?? 0;

  const handleSelect = (notification: Notification) => {
    setIsOpen(false);
    if (!notification.isRead) markReadMutation.mutate(notification.id);
    router.push(`/movies/${notification.tmdbMovieId}/book`);
  };

  return (
    <div className="relative">
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-white hover:text-white hover:bg-white/10 cursor-pointer rounded-full transition-all relative"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-semibold leading-none">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-80 bg-[#141414]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <p className="text-white font-medium text-sm">Notifications</p>
                {count > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-xs text-gray-400 hover:text-white cursor-pointer disabled:opacity-50"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    Loading...
                  </p>
                ) : !notifications || notifications.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    No notifications yet
                  </p>
                ) : (
                  notifications.slice(0, 8).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleSelect(notification)}
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="relative w-10 h-14 flex-shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={getImageUrl(notification.moviePosterPath, "w200")}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          <span className="font-medium">
                            {notification.movieTitle}
                          </span>{" "}
                          is now showing
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-white/10">
                <Link href="/notifications" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    View all
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
