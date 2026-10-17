import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { fetchMediaDetails } from "@/features/media/api";
import { createBookings } from "./bookings";
import { createStripeGateway } from "./stripe-gateway";

export const bookings = createBookings({
  db: prisma,
  gateway: createStripeGateway(stripe),
});

export async function movieTitleFor(tmdbMovieId: number): Promise<string> {
  const movie = await fetchMediaDetails("movie", tmdbMovieId).catch(() => null);
  return movie?.title ?? `Movie #${tmdbMovieId}`;
}

export { liveBookingWhere, HOLD_DURATION_MS } from "./bookings";
export type { StartBookingFailure, PayFailure } from "./bookings";
