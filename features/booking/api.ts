import { http } from "@/lib/http";
import type { Booking, CreateBookingInput, SeatMapResponse, Showtime } from "./types";

export function fetchShowtimesForMovie(tmdbMovieId: number | string) {
  return http.get<Showtime[]>("/api/showtimes", { tmdbMovieId });
}

export function fetchSeatMap(showtimeId: string) {
  return http.get<SeatMapResponse>(`/api/showtimes/${showtimeId}/seats`);
}

export function createBooking(input: CreateBookingInput) {
  return http.post<Booking>("/api/bookings", input);
}

export function fetchBooking(id: string) {
  return http.get<Booking>(`/api/bookings/${id}`);
}

export function createCheckoutForBooking(id: string) {
  return http.post<{ checkoutUrl: string }>(`/api/bookings/${id}/checkout`);
}
