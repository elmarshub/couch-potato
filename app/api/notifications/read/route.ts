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
import { markNotificationsReadSchema, formatZodError } from "@/lib/api/validation";

export const runtime = "nodejs";

const WRITE_LIMIT = { limit: 60, windowMs: 60_000 };

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) return unauthorized();

    const { allowed, retryAfterSeconds } = rateLimit(
      `notifications:read:${user.id}`,
      WRITE_LIMIT
    );
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const parsed = markNotificationsReadSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    if (parsed.data.all) {
      const unread = await prisma.notification.findMany({
        where: { reads: { none: { userId: user.id } } },
        select: { id: true },
      });

      await prisma.notificationRead.createMany({
        data: unread.map(({ id }) => ({ notificationId: id, userId: user.id })),
        skipDuplicates: true,
      });
    } else if (parsed.data.id) {
      const notification = await prisma.notification.findUnique({
        where: { id: parsed.data.id },
        select: { id: true },
      });
      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      await prisma.notificationRead.upsert({
        where: {
          notificationId_userId: {
            notificationId: parsed.data.id,
            userId: user.id,
          },
        },
        create: { notificationId: parsed.data.id, userId: user.id },
        update: {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverErrorResponse("Error marking notifications read", error);
  }
}
