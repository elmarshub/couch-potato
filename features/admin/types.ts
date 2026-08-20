export type SeatTier = "STANDARD" | "PREMIUM" | "VIP";

export interface ShowtimeSeatPrice {
  id: string;
  showtimeId: string;
  tier: SeatTier;
  priceCents: number;
}

export interface Showtime {
  id: string;
  tmdbMovieId: number;
  startsAt: string;
  isCancelled: boolean;
  createdAt: string;
  updatedAt: string;
  seatPrices: ShowtimeSeatPrice[];
}

export interface CreateShowtimeInput {
  tmdbMovieId: number;
  startsAt: string;
  seatPrices: Array<{ tier: SeatTier; priceCents: number }>;
}

export interface UpdateShowtimeInput {
  startsAt?: string;
  isCancelled?: boolean;
  seatPrices?: Array<{ tier: SeatTier; priceCents: number }>;
}
