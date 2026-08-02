import { fetchFromTMDB, type TmdbParams } from "@/lib/tmdb/client";
import type {
  CreditsResponse,
  DiscoverParams,
  GenreListResponse,
  MediaDetails,
  MediaType,
  Movie,
  MovieCategory,
  PaginatedResponse,
  Person,
  SearchResult,
  TVShow,
  VideoListResponse,
} from "./types";

const EMPTY_PAGINATED = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
} as const;

export async function safeFetch<T>(
  fetcher: () => Promise<PaginatedResponse<T>>
): Promise<PaginatedResponse<T>> {
  try {
    return await fetcher();
  } catch {
    return { ...EMPTY_PAGINATED, results: [] as T[] };
  }
}

const CATEGORY_GENRE_IDS: Partial<Record<MovieCategory, number>> = {
  action: 28,
  comedy: 35,
  animation: 16,
  adventure: 12,
  horror: 27,
  romance: 10749,
};

export function fetchMoviesByCategory(
  category: MovieCategory,
  page = 1
): Promise<PaginatedResponse<Movie>> {
  const genreId = CATEGORY_GENRE_IDS[category];
  if (genreId) {
    return fetchFromTMDB("/discover/movie", { with_genres: genreId, page });
  }

  switch (category) {
    case "trending":
      return fetchFromTMDB("/trending/movie/week", { page });
    case "popular":
      return fetchFromTMDB("/movie/popular", { page });
    case "top-rated":
      return fetchFromTMDB("/movie/top_rated", { page });
    case "now-playing":
      return fetchFromTMDB("/movie/now_playing", { page });
    case "upcoming":
      return fetchFromTMDB("/movie/upcoming", { page });
    case "hollywood":
      return fetchFromTMDB("/discover/movie", {
        with_original_language: "en",
        region: "US",
        sort_by: "popularity.desc",
        page,
      });
    case "nollywood":
      return fetchFromTMDB("/discover/movie", {
        with_origin_country: "NG",
        sort_by: "popularity.desc",
        page,
      });
    case "anime":
      return fetchFromTMDB("/discover/movie", {
        with_genres: 16,
        with_original_language: "ja",
        sort_by: "popularity.desc",
        page,
      });
    default:
      return fetchFromTMDB("/movie/popular", { page });
  }
}

export function fetchPopularMovies(page = 1): Promise<PaginatedResponse<Movie>> {
  return fetchFromTMDB("/movie/popular", { page });
}

export function fetchNowPlayingMovies(
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return fetchFromTMDB("/movie/now_playing", { page });
}

export function fetchTrendingMovies(
  page = 1
): Promise<PaginatedResponse<Movie>> {
  return fetchFromTMDB("/trending/movie/week", { page });
}

export function fetchPopularTVShows(
  page = 1
): Promise<PaginatedResponse<TVShow>> {
  return fetchFromTMDB("/tv/popular", { page });
}

export function fetchTrendingTVShows(
  page = 1
): Promise<PaginatedResponse<TVShow>> {
  return fetchFromTMDB("/trending/tv/week", { page });
}

export function fetchTrendingAll(
  window: "day" | "week" = "week"
): Promise<PaginatedResponse<SearchResult>> {
  return fetchFromTMDB(`/trending/all/${window}`);
}

function toDiscoverParams(params: DiscoverParams, yearKey: string): TmdbParams {
  const { page = 1, genre, year, sort = "popularity.desc" } = params;
  return {
    page,
    sort_by: sort,
    ...(genre ? { with_genres: genre } : {}),
    ...(year ? { [yearKey]: year } : {}),
  };
}

export function discoverMovies(
  params: DiscoverParams
): Promise<PaginatedResponse<Movie>> {
  return fetchFromTMDB(
    "/discover/movie",
    toDiscoverParams(params, "primary_release_year")
  );
}

export function discoverTVShows(
  params: DiscoverParams
): Promise<PaginatedResponse<TVShow>> {
  return fetchFromTMDB(
    "/discover/tv",
    toDiscoverParams(params, "first_air_date_year")
  );
}

export function fetchMediaDetails(
  type: MediaType,
  id: string | number
): Promise<MediaDetails> {
  return fetchFromTMDB(`/${type}/${id}`, {
    append_to_response: "credits,videos,recommendations",
  });
}

export function fetchMediaCredits(
  type: MediaType,
  id: string | number
): Promise<CreditsResponse> {
  return fetchFromTMDB(`/${type}/${id}/credits`);
}

export function fetchMediaVideos(
  type: MediaType,
  id: string | number
): Promise<VideoListResponse> {
  return fetchFromTMDB(`/${type}/${id}/videos`);
}

export function fetchGenres(type: MediaType): Promise<GenreListResponse> {
  return fetchFromTMDB(`/genre/${type}/list`);
}

export function searchMulti(
  query: string,
  page = 1
): Promise<PaginatedResponse<SearchResult>> {
  return fetchFromTMDB("/search/multi", { query, page });
}

export function fetchPerson(id: string | number): Promise<Person> {
  return fetchFromTMDB(`/person/${id}`, {
    append_to_response: "combined_credits,external_ids",
  });
}
