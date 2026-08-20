import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { fetchMediaDetails } from "@/features/media/api";
import {
  extractBearerToken,
  forbiddenOriginResponse,
  isSameOrigin,
  rateLimit,
  rateLimitResponse,
  readJsonBody,
  requireAdmin,
  serverErrorResponse,
} from "@/lib/api/guards";
import { createShowtimeSchema, formatZodError } from "@/lib/api/validation";

export const runtime = "nodejs";

const READ_LIMIT = { limit: 60, windowMs: 60_000 };
const WRITE_LIMIT = { limit: 30, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();
    const forbidden = requireAdmin(user);
    if (forbidden) return forbidden;

    const { allowed, retryAfterSeconds } = rateLimit(
      `admin:showtimes:get:${user.id}`,
      READ_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const showtimes = await prisma.showtime.findMany({
      orderBy: { startsAt: "desc" },
      include: { seatPrices: true },
      take: 500,
    });

    return NextResponse.json(showtimes, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return serverErrorResponse("Error fetching showtimes", error);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();
    const forbidden = requireAdmin(user);
    if (forbidden) return forbidden;

    const { allowed, retryAfterSeconds } = rateLimit(
      `admin:showtimes:write:${user.id}`,
      WRITE_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const parsed = createShowtimeSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { tmdbMovieId, startsAt, seatPrices } = parsed.data;

    const showtime = await prisma.showtime.create({
      data: {
        tmdbMovieId,
        startsAt,
        seatPrices: {
          create: seatPrices.map(({ tier, priceCents }) => ({
            tier,
            priceCents,
          })),
        },
      },
      include: { seatPrices: true },
    });

    let details: { title?: string; poster_path?: string | null } | null = null;
    try {
      details = await fetchMediaDetails("movie", tmdbMovieId);
    } catch (error) {
      console.error("Error fetching movie details for notification:", error);
    }
    try {
      await prisma.notification.create({
        data: {
          tmdbMovieId,
          movieTitle: details?.title ?? "New movie",
          moviePosterPath: details?.poster_path ?? null,
          showtimeId: showtime.id,
        },
      });
    } catch (error) {
      console.error("Error creating movie-added notification:", error);
    }

    return NextResponse.json(showtime, { status: 201 });
  } catch (error) {
    return serverErrorResponse("Error creating showtime", error);
  }
}
