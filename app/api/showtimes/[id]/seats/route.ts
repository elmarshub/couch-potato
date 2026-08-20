import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import {
  extractBearerToken,
  rateLimit,
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/api/guards";

export const runtime = "nodejs";

const READ_LIMIT = { limit: 60, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `showtimes:seats:${user.id}`,
      READ_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const { id } = await params;

    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: { seatPrices: true },
    });
    if (!showtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    const [allSeats, takenBookingSeats] = await Promise.all([
      prisma.seat.findMany({ orderBy: [{ row: "asc" }, { number: "asc" }] }),
      // A seat counts as taken if it's attached to a PAID booking, or a
      // PENDING booking whose hold hasn't expired yet (lazy-expiry read side).
      prisma.bookingSeat.findMany({
        where: {
          showtimeId: id,
          booking: {
            OR: [
              { status: "PAID" },
              { status: "PENDING", expiresAt: { gt: new Date() } },
            ],
          },
        },
        select: { seatId: true },
      }),
    ]);

    const takenSeatIds = new Set(takenBookingSeats.map((bs) => bs.seatId));
    const pricedTiers = new Set(showtime.seatPrices.map((p) => p.tier));

    const seats = allSeats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      tier: seat.tier,
      isTaken: takenSeatIds.has(seat.id),
      // A seat is only bookable if this showtime actually offers a price for
      // its tier — an admin can create a showtime without pricing every
      // tier (e.g. no VIP), and those seats must never be selectable.
      hasPrice: pricedTiers.has(seat.tier),
    }));

    return NextResponse.json(
      { showtime, seats },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return serverErrorResponse("Error fetching seat map", error);
  }
}
