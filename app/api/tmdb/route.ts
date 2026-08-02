import { NextResponse, type NextRequest } from "next/server";
import {
  ALLOWED_TMDB_PARAMS,
  fetchFromTMDBServer,
  isAllowedTMDBPath,
  type TmdbParams,
} from "@/lib/tmdb/client";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/api/guards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { allowed, retryAfterSeconds } = rateLimit(`tmdb:${clientIp(request)}`, {
    limit: 120,
    windowMs: 60_000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 }
    );
  }

  if (path.length > 200 || !isAllowedTMDBPath(path)) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 400 });
  }

  const params: TmdbParams = {};
  for (const [key, value] of searchParams.entries()) {
    if (key === "path") continue;
    if (!ALLOWED_TMDB_PARAMS.has(key)) continue;
    if (value.length > 200) continue;
    params[key] = value;
  }

  try {
    const data = await fetchFromTMDBServer(path, params);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error(
      "TMDB proxy error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 }
    );
  }
}
