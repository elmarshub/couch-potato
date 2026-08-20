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
  seatPrices: ShowtimeSeatPrice[];
}

export interface SeatMapSeat {
  id: string;
  row: string;
  number: number;
  tier: SeatTier;
  isTaken: boolean;
  hasPrice: boolean;
}

export interface SeatMapResponse {
  showtime: Showtime;
  seats: SeatMapSeat[];
}

export interface BookingSeat {
  id: string;
  seatId: string;
  priceCents: number;
  seat?: { row: string; number: number };
}

export type BookingStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "FAILED";

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  status: BookingStatus;
  amountCents: number;
  expiresAt: string;
  createdAt: string;
  seats: BookingSeat[];
  showtime?: Showtime;
  checkoutUrl?: string;
}

export interface CreateBookingInput {
  showtimeId: string;
  seatIds: string[];
}
