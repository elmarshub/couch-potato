"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/providers/auth-provider";
import { ApiError } from "@/lib/http";
import { queryKeys } from "@/lib/query-keys";
import type { MediaType } from "@/features/media/types";
import {
  addToLibrary,
  fetchLibrary,
  removeFromLibrary,
  type LibraryEndpoint,
} from "./api";
import type { LibraryItem, LibraryMutationInput } from "./types";

function useLibrary(endpoint: LibraryEndpoint, queryKey: readonly unknown[]) {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey,
    queryFn: () => fetchLibrary(endpoint),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    retry: false,
    placeholderData: [] as LibraryItem[],
  });
}

function useToggleLibrary(
  endpoint: LibraryEndpoint,
  queryKey: readonly unknown[]
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      mediaType,
      isActive,
    }: LibraryMutationInput): Promise<void> => {
      if (isActive) {
        await removeFromLibrary(endpoint, { mediaId, mediaType });
        return;
      }
      await addToLibrary(endpoint, { mediaId, mediaType });
    },

    onMutate: async ({
      mediaId,
      mediaType,
      isActive,
    }): Promise<{ previous: LibraryItem[] }> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LibraryItem[]>(queryKey) ?? [];

      queryClient.setQueryData<LibraryItem[]>(
        queryKey,
        isActive
          ? previous.filter(
              (item) =>
                !(item.mediaId === mediaId && item.mediaType === mediaType)
            )
          : [
              ...previous,
              {
                id: `optimistic-${mediaType}-${mediaId}`,
                userId: "optimistic",
                mediaType,
                mediaId,
                createdAt: new Date().toISOString(),
              },
            ]
      );

      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useFavorites() {
  return useLibrary("/api/favorites", queryKeys.favorites.list());
}

export function useToggleFavorite() {
  return useToggleLibrary("/api/favorites", queryKeys.favorites.list());
}

export function useWatchlist() {
  return useLibrary("/api/watchlist", queryKeys.watchlist.list());
}

export function useToggleWatchlist() {
  return useToggleLibrary("/api/watchlist", queryKeys.watchlist.list());
}

export function useIsInLibrary(
  items: LibraryItem[] | undefined,
  mediaId: number,
  mediaType: MediaType
) {
  return Boolean(
    items?.some(
      (item) => item.mediaId === mediaId && item.mediaType === mediaType
    )
  );
}

export function useIsFavorite(mediaId: number, mediaType: MediaType) {
  const { data } = useFavorites();
  return useIsInLibrary(data, mediaId, mediaType);
}

export function useIsInWatchlist(mediaId: number, mediaType: MediaType) {
  const { data } = useWatchlist();
  return useIsInLibrary(data, mediaId, mediaType);
}

export function libraryErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
