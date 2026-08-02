"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import { LogOut, Loader2 } from "lucide-react";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/avatar";

export default function ProfilePage() {
  const { user, isLoading, isSigningOut } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !isSigningOut) {
      router.replace("/login?redirectTo=%2Fprofile");
    }
  }, [isLoading, user, isSigningOut, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414]">
        <div className="h-40 md:h-56 w-full bg-white/5 animate-pulse mt-16 md:mt-20" />
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto -mt-14 md:-mt-16 space-y-8 pb-16">
            <div className="h-28 w-28 rounded-full bg-white/10 animate-pulse" />
            <div className="h-60 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="relative">
        <div className="relative z-0 h-56 md:h-[19rem] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-black to-red-900/20" />
          <div className="absolute inset-x-0 bottom-0 h-10 md:h-14 bg-gradient-to-t from-[#141414] to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto -mt-14 md:-mt-16 flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Avatar className="h-28 w-28 border-4 border-[#141414] shadow-xl">
                <AvatarImage
                  src={
                    user.avatarUrl ?? getAvatarUrl(user.email, user.name, 160)
                  }
                  alt={`${user.name || user.email}'s avatar`}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left sm:pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {user.name || "User"}
                </h1>
                <p className="text-white/60">{user.email}</p>
              </div>
            </div>

            {/* <Button
              variant="outline"
              onClick={() => signOut()}
              disabled={isSigningOut}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:mb-2"
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {isSigningOut ? "Signing out..." : "Log Out"}
            </Button> */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <ProfileForm user={user} />

          <div className="flex justify-center">
            <Button
              variant="ghost"
              asChild
              className="text-white/60 hover:bg-white/10 hover:text-white"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
