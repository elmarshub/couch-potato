import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import {
  extractBearerToken,
  forbiddenOriginResponse,
  isSameOrigin,
  rateLimit,
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/api/guards";
import {
  createCheckoutSessionForBooking,
  reconcileBookingWithStripe,
} from "@/lib/stripe-checkout";

export const runtime = "nodejs";

const WRITE_LIMIT = { limit: 20, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `bookings:checkout:${user.id}`,
      WRITE_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { seats: true, showtime: true },
    });

    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `This booking is ${booking.status.toLowerCase()} and can't be paid for` },
        { status: 409 }
      );
    }
    if (booking.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "This booking hold has expired" },
        { status: 409 }
      );
    }


    
    const reconciliation = await reconcileBookingWithStripe(booking);

    if (reconciliation.outcome === "already-paid") {
      return NextResponse.json(
        { error: "This booking has already been paid for" },
        { status: 409 }
      );
    }

    if (reconciliation.outcome === "reuse-existing-session") {
      return NextResponse.json({ checkoutUrl: reconciliation.checkoutUrl });
    }

    const checkoutUrl = await createCheckoutSessionForBooking(
      booking,
      booking.showtime
    );

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return serverErrorResponse("Error creating checkout session", error);
  }
}
