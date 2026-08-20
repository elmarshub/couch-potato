"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  cancelShowtime,
  createShowtime,
  fetchAdminShowtime,
  updateShowtime,
} from "./api";
import type { CreateShowtimeInput, UpdateShowtimeInput } from "./types";

export function useAdminShowtimeQuery(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.showtimes(), id],
    queryFn: () => fetchAdminShowtime(id),
    enabled: Boolean(id),
  });
}

export function useCreateShowtimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShowtimeInput) => createShowtime(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.showtimes() });
    },
  });
}

export function useUpdateShowtimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateShowtimeInput }) =>
      updateShowtime(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.showtimes() });
    },
  });
}

export function useCancelShowtimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelShowtime(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.showtimes() });
    },
  });
}
