import type { MediaType } from "@/features/media/types";

export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  search: "/search",
  movies: "/movies",
  tvshows: "/tvshows",
  profile: "/profile",
  likes: "/profile/likes",
  watchlist: "/watchlist",
  library: "/library",
  libraryTab: (tab: "favorites" | "watchlist") => `/library?tab=${tab}`,
  movie: (id: number | string) => `/movies/${id}`,
  tvshow: (id: number | string) => `/tvshows/${id}`,
  person: (id: number | string) => `/person/${id}`,
  category: (id: string) => `/category/${id}`,
  media: (type: MediaType, id: number | string) =>
    type === "tv" ? `/tvshows/${id}` : `/movies/${id}`,
  loginWithRedirect: (target: string) =>
    `/login?redirectTo=${encodeURIComponent(target)}`,
};
