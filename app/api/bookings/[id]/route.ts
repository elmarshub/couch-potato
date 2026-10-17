import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  extractBearerToken,
  rateLimit,
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/api/guards";
import { bookings } from "@/features/booking/server";

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

    const booking = await bookings.get({ userId: user.id, bookingId: id });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return serverErrorResponse("Error fetching booking", error);
  }
}
