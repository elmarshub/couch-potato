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

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `notifications:get:${user.id}`,
      READ_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        reads: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    });

    const items = notifications.map(({ reads, ...notification }) => ({
      ...notification,
      isRead: reads.length > 0,
    }));

    return NextResponse.json(items, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return serverErrorResponse("Error fetching notifications", error);
  }
}
