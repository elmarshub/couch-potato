export type NotificationType = "MOVIE_ADDED";

export interface Notification {
  id: string;
  type: NotificationType;
  tmdbMovieId: number;
  movieTitle: string;
  moviePosterPath: string | null;
  showtimeId: string | null;
  createdAt: string;
  isRead: boolean;
}
