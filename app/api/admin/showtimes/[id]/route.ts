import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
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
import { formatZodError, updateShowtimeSchema } from "@/lib/api/validation";

export const runtime = "nodejs";

const READ_LIMIT = { limit: 60, windowMs: 60_000 };
const WRITE_LIMIT = { limit: 30, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: { seatPrices: true },
    });

    if (!showtime) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(showtime, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return serverErrorResponse("Error fetching showtime", error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const parsed = updateShowtimeSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { startsAt, isCancelled, seatPrices } = parsed.data;

    const showtime = await prisma.$transaction(async (tx) => {
      await tx.showtime.update({
        where: { id },
        data: { startsAt, isCancelled },
      });

      if (seatPrices) {
        await tx.showtimeSeatPrice.deleteMany({ where: { showtimeId: id } });
        await tx.showtimeSeatPrice.createMany({
          data: seatPrices.map(({ tier, priceCents }) => ({
            showtimeId: id,
            tier,
            priceCents,
          })),
        });
      }

      return tx.showtime.findUniqueOrThrow({
        where: { id },
        include: { seatPrices: true },
      });
    });

    return NextResponse.json(showtime);
  } catch (error) {
    return serverErrorResponse("Error updating showtime", error);
  }
}

export async function DELETE(
  
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

   
    const showtime = await prisma.$transaction(async (tx) => {
      await tx.bookingSeat.deleteMany({
        where: {
          showtimeId: id,
          booking: { status: "PENDING" },
        },
      });
      await tx.booking.updateMany({
        where: { showtimeId: id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
      return tx.showtime.update({
        where: { id },
        data: { isCancelled: true },
      });
    });

    return NextResponse.json(showtime);
  } catch (error) {
    return serverErrorResponse("Error cancelling showtime", error);
  }
}
