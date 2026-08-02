import type { DiscoverParams, MediaType, MovieCategory } from "@/features/media/types";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    currentUser: () => [...queryKeys.auth.all, "current-user"] as const,
  },
  media: {
    all: ["media"] as const,
    trending: (scope: "all" | MediaType, window: "day" | "week") =>
      [...queryKeys.media.all, "trending", scope, window] as const,
    details: (type: MediaType, id: string | number) =>
      [...queryKeys.media.all, "details", type, String(id)] as const,
    credits: (type: MediaType, id: string | number) =>
      [...queryKeys.media.all, "credits", type, String(id)] as const,
    videos: (type: MediaType, id: string | number) =>
      [...queryKeys.media.all, "videos", type, String(id)] as const,
    genres: (type: MediaType) =>
      [...queryKeys.media.all, "genres", type] as const,
    search: (query: string, page: number) =>
      [...queryKeys.media.all, "search", query, page] as const,
    person: (id: string | number) =>
      [...queryKeys.media.all, "person", String(id)] as const,
  },
  movies: {
    all: ["movies"] as const,
    category: (category: MovieCategory) =>
      [...queryKeys.movies.all, "category", category] as const,
    categoryInfinite: (category: MovieCategory) =>
      [...queryKeys.movies.all, "category", category, "infinite"] as const,
    popular: (page: number) =>
      [...queryKeys.movies.all, "popular", page] as const,
    nowPlaying: (page: number) =>
      [...queryKeys.movies.all, "now-playing", page] as const,
    browse: (params: DiscoverParams) =>
      [...queryKeys.movies.all, "browse", params] as const,
  },
  tv: {
    all: ["tv"] as const,
    popular: (page: number) => [...queryKeys.tv.all, "popular", page] as const,
    popularInfinite: () =>
      [...queryKeys.tv.all, "popular", "infinite"] as const,
    trending: () => [...queryKeys.tv.all, "trending"] as const,
    browse: (params: DiscoverParams) =>
      [...queryKeys.tv.all, "browse", params] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    list: () => [...queryKeys.favorites.all, "list"] as const,
  },
  watchlist: {
    all: ["watchlist"] as const,
    list: () => [...queryKeys.watchlist.all, "list"] as const,
  },
} as const;
