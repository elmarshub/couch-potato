const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const ALLOWED_TMDB_PATHS = [
  "/trending/",
  "/movie/",
  "/tv/",
  "/person/",
  "/discover/movie",
  "/discover/tv",
  "/search/multi",
  "/search/movie",
  "/search/tv",
  "/genre/",
] as const;

export const ALLOWED_TMDB_PARAMS = new Set([
  "page",
  "query",
  "sort_by",
  "with_genres",
  "with_original_language",
  "with_origin_country",
  "primary_release_year",
  "first_air_date_year",
  "region",
  "append_to_response",
  "language",
  "include_adult",
  "time_window",
]);

export type TmdbParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export function isAllowedTMDBPath(path: string): boolean {
  if (!path.startsWith("/") || path.includes("..") || path.includes("//")) {
    return false;
  }
  return ALLOWED_TMDB_PATHS.some((prefix) => path.startsWith(prefix));
}

function serializeParams(params: TmdbParams): [string, string][] {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)] as [string, string]);
}

export async function fetchFromTMDBServer<T>(
  endpoint: string,
  params: TmdbParams = {}
): Promise<T> {
  if (!isAllowedTMDBPath(endpoint)) {
    throw new Error(`Disallowed TMDB endpoint: ${endpoint}`);
  }

  const readToken = process.env.TMDB_API_READ_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!readToken && !apiKey) {
    throw new Error(
      "TMDB credentials missing: set TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY"
    );
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  for (const [key, value] of serializeParams(params)) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (readToken) {
    headers.Authorization = `Bearer ${readToken}`;
  } else {
    url.searchParams.set("api_key", apiKey as string);
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function fetchFromTMDBProxy<T>(
  endpoint: string,
  params: TmdbParams = {}
): Promise<T> {
  const url = new URL("/api/tmdb", window.location.origin);
  url.searchParams.set("path", endpoint);
  for (const [key, value] of serializeParams(params)) {
    if (key === "path") continue;
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchFromTMDB<T>(
  endpoint: string,
  params: TmdbParams = {}
): Promise<T> {
  if (typeof window === "undefined") {
    return fetchFromTMDBServer<T>(endpoint, params);
  }
  return fetchFromTMDBProxy<T>(endpoint, params);
}
