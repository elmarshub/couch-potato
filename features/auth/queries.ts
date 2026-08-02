"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/http";
import { queryKeys } from "@/lib/query-keys";
import { hasSupabaseSessionCookie } from "@/lib/supabase/session-cookie";
import { fetchCurrentUser, updateProfile } from "./api";
import type { AuthUser } from "./types";

export function useCurrentUserQuery() {
  return useQuery<AuthUser | null>({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      try {
        return await fetchCurrentUser();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    enabled: hasSupabaseSessionCookie(),
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.currentUser(), user);
    },
  });
}
