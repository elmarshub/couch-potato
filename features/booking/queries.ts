"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createBooking,
  createCheckoutForBooking,
  fetchBooking,
  fetchSeatMap,
  fetchShowtimesForMovie,
} from "./api";
import type { Booking, CreateBookingInput } from "./types";

export function useShowtimesForMovieQuery(tmdbMovieId: number | string) {
  return useQuery({
    queryKey: queryKeys.booking.showtimesForMovie(tmdbMovieId),
    queryFn: () => fetchShowtimesForMovie(tmdbMovieId),
    enabled: Boolean(tmdbMovieId),
    staleTime: 1000 * 30,
  });
}

export function useSeatMapQuery(showtimeId: string) {
  return useQuery({
    queryKey: queryKeys.booking.seatMap(showtimeId),
    queryFn: () => fetchSeatMap(showtimeId),
    enabled: Boolean(showtimeId),
    refetchInterval: 10_000,
  });
}

export function useCreateBookingMutation() {
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
  });
}

export function useBookingQuery(bookingId: string, initialData?: Booking) {
  return useQuery({
    queryKey: queryKeys.booking.detail(bookingId),
    queryFn: () => fetchBooking(bookingId),
    enabled: Boolean(bookingId),
    initialData,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 3000 : false,
  });
}

export function useCreateCheckoutMutation() {
  return useMutation({
    mutationFn: (bookingId: string) => createCheckoutForBooking(bookingId),
  });
}
