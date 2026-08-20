import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import {
  extractBearerToken,
  rateLimit,
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/api/guards";
import { reconcileBookingWithStripe } from "@/lib/stripe-checkout";

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
      `bookings:get:${user.id}`,
      READ_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const { id } = await params;

    let booking = await prisma.booking.findUnique({
      where: { id },
      include: { seats: { include: { seat: true } }, showtime: true },
    });

    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Self-heal against Stripe directly rather than relying solely on the
    // webhook having arrived — this is what makes the confirmation page
    // update correctly even if no webhook listener is forwarding events
    // locally, and is a no-op once the webhook has already reconciled it.
    if (booking.status === "PENDING" && booking.stripeCheckoutSessionId) {
      const reconciliation = await reconcileBookingWithStripe(booking).catch(
        () => null
      );
      if (reconciliation?.outcome === "already-paid") {
        booking = await prisma.booking.findUnique({
          where: { id },
          include: { seats: { include: { seat: true } }, showtime: true },
        });
      }
    }

    return NextResponse.json(booking, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return serverErrorResponse("Error fetching booking", error);
  }
}
