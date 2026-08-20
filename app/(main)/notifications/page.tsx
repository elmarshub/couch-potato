import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { NotificationsList } from "@/features/notifications/components/notifications-list";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=%2Fnotifications");

  return (
    <main className="min-h-screen bg-[#141414] text-white pt-24 md:pt-28 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Notifications</h1>
        <NotificationsList />
      </div>
    </main>
  );
}
