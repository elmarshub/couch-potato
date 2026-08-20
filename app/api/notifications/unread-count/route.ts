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

const READ_LIMIT = { limit: 120, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `notifications:unread-count:${user.id}`,
      READ_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const count = await prisma.notification.count({
      where: { reads: { none: { userId: user.id } } },
    });

    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return serverErrorResponse("Error fetching unread notification count", error);
  }
}
