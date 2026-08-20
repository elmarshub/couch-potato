import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import {
  extractBearerToken,
  forbiddenOriginResponse,
  isSameOrigin,
  rateLimit,
  rateLimitResponse,
  readJsonBody,
  serverErrorResponse,
} from "@/lib/api/guards";
import { createBookingSchema, formatZodError } from "@/lib/api/validation";
import { createCheckoutSessionForBooking } from "@/lib/stripe-checkout";
import { HOLD_DURATION_MS } from "@/lib/booking-constants";

export const runtime = "nodejs";

const WRITE_LIMIT = { limit: 20, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `bookings:write:${user.id}`,
      WRITE_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const parsed = createBookingSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { showtimeId, seatIds } = parsed.data;

    const uniqueSeatIds = Array.from(new Set(seatIds));

    const { booking, showtime } = await prisma.$transaction(async (tx) => {
      const showtime = await tx.showtime.findUnique({
        where: { id: showtimeId },
        include: { seatPrices: true },
      });
      if (!showtime || showtime.isCancelled) {
        throw new Error("SHOWTIME_UNAVAILABLE");
      }
      if (showtime.startsAt <= new Date()) {
        throw new Error("SHOWTIME_IN_PAST");
      }

      const seats = await tx.seat.findMany({
        where: { id: { in: uniqueSeatIds } },
      });
      if (seats.length !== uniqueSeatIds.length) {
        throw new Error("INVALID_SEAT");
      }

      // Lazy-expire: release any stale PENDING holds on these seats before
      // attempting to claim them, so an abandoned checkout doesn't block a
      // seat forever.
      const staleBookingSeats = await tx.bookingSeat.findMany({
        where: {
          showtimeId,
          seatId: { in: uniqueSeatIds },
          booking: { status: "PENDING", expiresAt: { lte: new Date() } },
        },
        select: { id: true, bookingId: true },
      });
      if (staleBookingSeats.length > 0) {
        await tx.bookingSeat.deleteMany({
          where: { id: { in: staleBookingSeats.map((bs) => bs.id) } },
        });
        await tx.booking.updateMany({
          where: {
            id: { in: staleBookingSeats.map((bs) => bs.bookingId) },
            status: "PENDING",
          },
          data: { status: "EXPIRED" },
        });
      }

      const priceByTier = new Map(
        showtime.seatPrices.map((p) => [p.tier, p.priceCents])
      );
      const seatSelections = seats.map((seat) => {
        const priceCents = priceByTier.get(seat.tier);
        if (priceCents === undefined) throw new Error("MISSING_TIER_PRICE");
        return { seatId: seat.id, priceCents };
      });
      const amountCents = seatSelections.reduce((sum, s) => sum + s.priceCents, 0);

      // The @@unique([showtimeId, seatId]) constraint on BookingSeat is the
      // actual concurrency guard: if another request claimed one of these
      // seats first, this insert throws a unique-violation (P2002) below.
      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          showtimeId,
          amountCents,
          expiresAt: new Date(Date.now() + HOLD_DURATION_MS),
          seats: {
            create: seatSelections.map(({ seatId, priceCents }) => ({
              seatId,
              showtimeId,
              priceCents,
            })),
          },
        },
        include: { seats: true },
      });

      return { booking, showtime };
    });

    let checkoutUrl: string;
    try {
      checkoutUrl = await createCheckoutSessionForBooking(booking, showtime);
    } catch (checkoutError) {
      console.error("Stripe checkout session creation failed:", checkoutError);
      return NextResponse.json(
        {
          error:
            "Booking created but payment setup failed. Retry from My Bookings.",
          booking,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ...booking, checkoutUrl }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "One or more seats are no longer available" },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "SHOWTIME_UNAVAILABLE") {
      return NextResponse.json({ error: "Showtime unavailable" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "SHOWTIME_IN_PAST") {
      return NextResponse.json({ error: "Showtime has already started" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INVALID_SEAT") {
      return NextResponse.json({ error: "Invalid seat selection" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "MISSING_TIER_PRICE") {
      return NextResponse.json(
        { error: "This showtime is missing a price for one of the selected seats" },
        { status: 500 }
      );
    }
    return serverErrorResponse("Error creating booking", error);
  }
}
