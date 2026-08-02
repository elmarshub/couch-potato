import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { extractBearerToken, serverErrorResponse } from "@/lib/api/guards";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(extractBearerToken(request));

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return serverErrorResponse("Error loading current user", error);
  }
}
