"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  discoverMovies,
  discoverTVShows,
  fetchGenres,
  fetchMediaCredits,
  fetchMediaDetails,
  fetchMediaVideos,
  fetchMoviesByCategory,
  fetchNowPlayingMovies,
  fetchPerson,
  fetchPopularMovies,
  fetchPopularTVShows,
  fetchTrendingAll,
  fetchTrendingTVShows,
  searchMulti,
} from "./api";
import type {
  DiscoverParams,
  MediaType,
  Movie,
  MovieCategory,
  PaginatedResponse,
  TVShow,
  Video,
} from "./types";

const FIVE_MINUTES = 1000 * 60 * 5;
const TEN_MINUTES = 1000 * 60 * 10;

function nextPageParam<T>(lastPage: PaginatedResponse<T>) {
  return lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined;
}

export function useMoviesByCategory(category: MovieCategory, page = 1) {
  return useQuery({
    queryKey: queryKeys.movies.category(category),
    queryFn: () => fetchMoviesByCategory(category, page),
    staleTime: FIVE_MINUTES,
  });
}

export function useInfiniteMoviesByCategory(category: MovieCategory) {
  return useInfiniteQuery({
    queryKey: queryKeys.movies.categoryInfinite(category),
    queryFn: ({ pageParam }) => fetchMoviesByCategory(category, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    staleTime: FIVE_MINUTES,
  });
}

export function useNowPlayingMovies(page = 1) {
  return useQuery({
    queryKey: queryKeys.movies.nowPlaying(page),
    queryFn: () => fetchNowPlayingMovies(page),
    staleTime: FIVE_MINUTES,
  });
}

export function useInfinitePopularTVShows() {
  return useInfiniteQuery({
    queryKey: queryKeys.tv.popularInfinite(),
    queryFn: ({ pageParam }) => fetchPopularTVShows(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    staleTime: FIVE_MINUTES,
  });
}

export function usePopularTVShows(page = 1) {
  return useQuery({
    queryKey: queryKeys.tv.popular(page),
    queryFn: () => fetchPopularTVShows(page),
    staleTime: FIVE_MINUTES,
  });
}

export function useTrendingTVShows() {
  return useQuery({
    queryKey: queryKeys.tv.trending(),
    queryFn: () => fetchTrendingTVShows(),
    staleTime: FIVE_MINUTES,
  });
}

export function useTrending(window: "day" | "week" = "week") {
  return useQuery({
    queryKey: queryKeys.media.trending("all", window),
    queryFn: () => fetchTrendingAll(window),
    select: (data) => data.results,
    staleTime: FIVE_MINUTES,
  });
}

export function useBrowseMovies(params: DiscoverParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.movies.browse({ genre: params.genre, sort: params.sort }),
    queryFn: ({ pageParam }) =>
      params.genre
        ? discoverMovies({ ...params, page: pageParam })
        : fetchPopularMovies(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    staleTime: FIVE_MINUTES,
    select: (data) => ({
      pages: data.pages,
      items: data.pages.flatMap((page) => page.results) as Movie[],
    }),
  });
}

export function useBrowseTVShows(params: DiscoverParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.tv.browse({ genre: params.genre, sort: params.sort }),
    queryFn: ({ pageParam }) =>
      params.genre
        ? discoverTVShows({ ...params, page: pageParam })
        : fetchPopularTVShows(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    staleTime: FIVE_MINUTES,
    select: (data) => ({
      pages: data.pages,
      items: data.pages.flatMap((page) => page.results) as TVShow[],
    }),
  });
}

export function useMediaDetails(type: MediaType, id: string) {
  return useQuery({
    queryKey: queryKeys.media.details(type, id),
    queryFn: () => fetchMediaDetails(type, id),
    enabled: Boolean(id),
    staleTime: TEN_MINUTES,
  });
}

export function useMediaCredits(type: MediaType, id: string, limit = 6) {
  return useQuery({
    queryKey: queryKeys.media.credits(type, id),
    queryFn: () => fetchMediaCredits(type, id),
    enabled: Boolean(id),
    staleTime: TEN_MINUTES,
    select: (data) => (data.cast ?? []).slice(0, limit),
  });
}

export function useMediaVideos(type: MediaType, id: string) {
  return useQuery({
    queryKey: queryKeys.media.videos(type, id),
    queryFn: () => fetchMediaVideos(type, id),
    enabled: Boolean(id),
    staleTime: TEN_MINUTES,
    select: (data) => {
      const youtube = (data.results ?? []).filter(
        (video) => video.site === "YouTube"
      );
      const rank = (video: Video) => {
        const typeScore = video.type === "Trailer" ? 1 : video.type === "Teaser" ? 0 : -1;
        return typeScore * 10 + (video.official ? 1 : 0);
      };
      return youtube
        .filter((video) => rank(video) >= 0)
        .sort((a, b) => rank(b) - rank(a));
    },
  });
}

export function useGenres(type: MediaType) {
  return useQuery({
    queryKey: queryKeys.media.genres(type),
    queryFn: () => fetchGenres(type),
    staleTime: 1000 * 60 * 60,
    select: (data) => data.genres ?? [],
  });
}

export function useSearch(query: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.media.search(query, page),
    queryFn: () => searchMulti(query, page),
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
    select: (data) => data.results ?? [],
  });
}

export function usePerson(id: string | number) {
  return useQuery({
    queryKey: queryKeys.media.person(id),
    queryFn: () => fetchPerson(id),
    enabled: Boolean(id),
    staleTime: TEN_MINUTES,
  });
}
