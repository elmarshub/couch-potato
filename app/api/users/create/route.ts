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

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { allowed, retryAfterSeconds } = rateLimit(`users:create:${user.id}`, {
      limit: 10,
      windowMs: 60_000,
    });
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    return NextResponse.json({ user });
  } catch (error) {
    return serverErrorResponse("Error creating user", error);
  }
}
