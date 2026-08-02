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
  serverErrorResponse,
} from "@/lib/api/guards";
import { formatZodError, mediaItemSchema } from "@/lib/api/validation";

export const runtime = "nodejs";

const READ_LIMIT = { limit: 60, windowMs: 60_000 };
const WRITE_LIMIT = { limit: 30, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `watchlist:get:${user.id}`,
      READ_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json(watchlist, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return serverErrorResponse("Error fetching watchlist", error);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `watchlist:write:${user.id}`,
      WRITE_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const parsed = mediaItemSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { mediaType, mediaId } = parsed.data;

    const item = await prisma.watchlist.upsert({
      where: {
        userId_mediaType_mediaId: { userId: user.id, mediaType, mediaId },
      },
      update: {},
      create: { userId: user.id, mediaType, mediaId },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return serverErrorResponse("Error adding to watchlist", error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `watchlist:write:${user.id}`,
      WRITE_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const { searchParams } = new URL(request.url);
    const parsed = mediaItemSchema.safeParse({
      mediaType: searchParams.get("mediaType"),
      mediaId: searchParams.get("mediaId"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { mediaType, mediaId } = parsed.data;

    const result = await prisma.watchlist.deleteMany({
      where: { userId: user.id, mediaType, mediaId },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    return serverErrorResponse("Error removing from watchlist", error);
  }
}
