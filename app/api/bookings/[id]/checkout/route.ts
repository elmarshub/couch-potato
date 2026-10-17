import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  extractBearerToken,
  forbiddenOriginResponse,
  isSameOrigin,
  rateLimit,
  rateLimitResponse,
  serverErrorResponse,
} from "@/lib/api/guards";
import { bookings, movieTitleFor } from "@/features/booking/server";
import { payFailureResponse } from "@/features/booking/server/responses";

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

    const result = await bookings.pay({
      userId: user.id,
      bookingId: id,
      movieTitle: movieTitleFor,
    });
    if (!result.ok) return payFailureResponse(result);

    const { checkoutUrl } = result.value;
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    return serverErrorResponse("Error creating checkout session", error);
  }
}
