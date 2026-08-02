"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signOutAction } from "@/features/auth/actions";
import { useCurrentUserQuery } from "@/features/auth/queries";
import type { AuthUser } from "@/features/auth/types";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  isSigningOut: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data, isLoading, isError } = useCurrentUserQuery();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
  }, [queryClient]);

  const signOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const toastId = toast.loading("Signing out...");

    router.replace("/");
    try {
      await supabase.auth.signOut();
      await signOutAction();
      queryClient.clear();
      toast.success("You've been signed out", { id: toastId });
    } catch {
      toast.error("Something went wrong while signing out", { id: toastId });
      setIsSigningOut(false);
    }
  }, [supabase, queryClient, router, isSigningOut]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        queryClient.setQueryData(queryKeys.auth.currentUser(), null);
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
        if (event === "SIGNED_IN") setIsSigningOut(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isAuthenticated: Boolean(data),
      isLoading,
      isError,
      isSigningOut,
      refresh,
      signOut,
    }),
    [data, isLoading, isError, isSigningOut, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }
  return context;
}
