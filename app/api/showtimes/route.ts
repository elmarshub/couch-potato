import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/api/guards";
import { mediaIdSchema } from "@/lib/api/validation";

export const runtime = "nodejs";

const READ_LIMIT = { limit: 120, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  try {
    const { allowed, retryAfterSeconds } = rateLimit(
      `showtimes:get:${clientIp(request)}`,
      READ_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const { searchParams } = request.nextUrl;
    const tmdbMovieIdParam = searchParams.get("tmdbMovieId");

    const where = {
      isCancelled: false,
      startsAt: { gt: new Date() },
      ...(tmdbMovieIdParam
        ? { tmdbMovieId: mediaIdSchema.parse(tmdbMovieIdParam) }
        : {}),
    };

    const showtimes = await prisma.showtime.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { seatPrices: true },
      take: 200,
    });

    return NextResponse.json(showtimes, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
