import { http } from "@/lib/http";
import type { MediaType } from "@/features/media/types";
import type { LibraryItem } from "./types";

export type LibraryEndpoint = "/api/favorites" | "/api/watchlist";

export function fetchLibrary(endpoint: LibraryEndpoint) {
  return http.get<LibraryItem[]>(endpoint);
}

export function addToLibrary(
  endpoint: LibraryEndpoint,
  input: { mediaType: MediaType; mediaId: number }
) {
  return http.post<LibraryItem>(endpoint, input);
}

export function removeFromLibrary(
  endpoint: LibraryEndpoint,
  input: { mediaType: MediaType; mediaId: number }
) {
  return http.delete<{ success: boolean; deleted: number }>(endpoint, {
    mediaType: input.mediaType,
    mediaId: input.mediaId,
  });
}
