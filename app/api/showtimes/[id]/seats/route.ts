import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { bookings } from "@/features/booking/server";
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

    const seatMap = await bookings.seatMap(id);
    if (!seatMap) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }
    const { showtime, seats } = seatMap;

    return NextResponse.json(
      { showtime, seats },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return serverErrorResponse("Error fetching seat map", error);
  }
}
