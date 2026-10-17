import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
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
import { bookings, movieTitleFor } from "@/features/booking/server";
import { startFailureResponse } from "@/features/booking/server/responses";

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

    const result = await bookings.start({
      userId: user.id,
      showtimeId,
      seatIds,
      movieTitle: movieTitleFor,
    });
    if (!result.ok) return startFailureResponse(result);

    const { booking, checkoutUrl } = result.value;
    return NextResponse.json({ ...booking, checkoutUrl }, { status: 201 });
  } catch (error) {
    return serverErrorResponse("Error creating booking", error);
  }
}
