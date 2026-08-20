import type { Booking, BookingSeat, Showtime } from "@prisma/client";
import { stripe } from "./stripe";
import { prisma } from "./prisma";
import { fetchMediaDetails } from "@/features/media/api";
import { HOLD_DURATION_MS } from "@/lib/booking-constants";

const STRIPE_MIN_SESSION_LIFETIME_SECONDS = 30 * 60;

interface BookingWithSeats extends Booking {
  seats: BookingSeat[];
}

export async function createCheckoutSessionForBooking(
  booking: BookingWithSeats,
  showtime: Showtime
): Promise<string> {
  const movie = await fetchMediaDetails("movie", showtime.tmdbMovieId).catch(
    () => null
  );
  const movieTitle = movie?.title ?? `Movie #${showtime.tmdbMovieId}`;

  const vercelUrl = process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;
  const vercelProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const preferProductionDomain = process.env.VERCEL_ENV === "production";

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (preferProductionDomain ? vercelProductionUrl : vercelUrl) ||
    vercelProductionUrl ||
    vercelUrl ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${movieTitle} — ${booking.seats.length} seat${
              booking.seats.length === 1 ? "" : "s"
            }`,
            description: `Showtime: ${showtime.startsAt.toLocaleString("en-US", {
            timeZone: "UTC",
            dateStyle: "medium",
            timeStyle: "short",
          })} UTC`,
          },
          unit_amount: booking.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking.id },
    payment_intent_data: { metadata: { bookingId: booking.id } },
    success_url: `${appUrl}/theater/confirmation/${booking.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/movies/${showtime.tmdbMovieId}/book/${showtime.id}/seats?cancelled=1`,
    expires_at:
      Math.floor(Date.now() / 1000) +
      Math.max(STRIPE_MIN_SESSION_LIFETIME_SECONDS, HOLD_DURATION_MS / 1000),
  });

  if (!session.url) {
    throw new Error("STRIPE_SESSION_NO_URL");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return session.url;
}

export type ReconcileResult =
  | { outcome: "already-paid" }
  | { outcome: "reuse-existing-session"; checkoutUrl: string }
  | { outcome: "needs-new-session" };

/**
 * Checks Stripe directly for the booking's current session before letting a
 * caller create a new one. This is what actually prevents double-charges: if
 * the existing session already succeeded (even if our webhook never fired —
 * e.g. no local tunnel running), we self-heal the booking to PAID here
 * instead of handing out a second payable Checkout Session. If the existing
 * session is still open and unpaid, we reuse it rather than creating a
 * duplicate that the customer could also complete.
 */
export async function reconcileBookingWithStripe(
  booking: Booking
): Promise<ReconcileResult> {
  if (!booking.stripeCheckoutSessionId) {
    return { outcome: "needs-new-session" };
  }

  const session = await stripe.checkout.sessions.retrieve(
    booking.stripeCheckoutSessionId
  );

  if (session.payment_status === "paid") {
    if (booking.status === "PENDING") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);
      // Same lock-and-verify guard as the webhook's markBookingPaid: don't
      // resurrect this booking as PAID if its showtime was cancelled while
      // payment was in flight.
      await prisma.$transaction(async (tx) => {
        const current = await tx.booking.findUnique({ where: { id: booking.id } });
        if (!current || current.status !== "PENDING") return;

        await tx.$queryRaw`SELECT id FROM "showtimes" WHERE id = ${booking.showtimeId} FOR UPDATE`;
        const showtime = await tx.showtime.findUnique({
          where: { id: booking.showtimeId },
        });

        if (!showtime || showtime.isCancelled) {
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED", stripePaymentIntentId: paymentIntentId },
          });
          console.error(
            `Booking ${booking.id} paid after its showtime was cancelled — needs manual refund`
          );
          return;
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
        });
      });
    }
    return { outcome: "already-paid" };
  }

  if (session.status === "open" && session.url) {
    return { outcome: "reuse-existing-session", checkoutUrl: session.url };
  }

  return { outcome: "needs-new-session" };
}
