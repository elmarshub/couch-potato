export type MediaType = "movie" | "tv";

export type MovieCategory =
  | "trending"
  | "popular"
  | "top-rated"
  | "now-playing"
  | "upcoming"
  | "action"
  | "comedy"
  | "animation"
  | "adventure"
  | "horror"
  | "romance"
  | "hollywood"
  | "nollywood"
  | "anime";

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
  popularity?: number;
  original_language?: string;
  adult?: boolean;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
  popularity?: number;
  original_language?: string;
  origin_country?: string[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface GenreListResponse {
  genres: Genre[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface CreditsResponse {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface VideoListResponse {
  results: Video[];
}

export interface MediaDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  genres?: Genre[];
  credits?: CreditsResponse;
  videos?: VideoListResponse;
  recommendations?: PaginatedResponse<Movie & TVShow>;
}

export interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  media_type: MediaType;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
}

export interface ExternalIds {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
}

export interface Person {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  also_known_as?: string[];
  combined_credits?: {
    cast: PersonCredit[];
    crew: PersonCredit[];
  };
  external_ids?: ExternalIds;
}

export interface SearchResult {
  id: number;
  media_type: MediaType | "person";
  title?: string;
  name?: string;
  poster_path: string | null;
  profile_path: string | null;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface DiscoverParams {
  page?: number;
  genre?: string;
  year?: string;
  sort?: string;
}
