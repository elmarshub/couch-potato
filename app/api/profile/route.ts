import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
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
import { formatZodError, profileUpdateSchema } from "@/lib/api/validation";
import { findAvatarPreset } from "@/lib/avatar-presets";
import { renderAvatarPresetDataUri } from "@/lib/avatar-preset-render";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return forbiddenOriginResponse();

    const user = await getCurrentUser(extractBearerToken(request));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, retryAfterSeconds } = rateLimit(`profile:patch:${user.id}`, {
      limit: 10,
      windowMs: 60_000,
    });
    if (!allowed) return rateLimitResponse(retryAfterSeconds);

    const parsed = profileUpdateSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { name, avatarPreset } = parsed.data;
    if (name === undefined && avatarPreset === undefined) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    let avatarUrl: string | undefined;
    if (avatarPreset !== undefined) {
      const preset = findAvatarPreset(avatarPreset);
      if (!preset) {
        return NextResponse.json({ error: "Unknown avatar preset" }, { status: 400 });
      }
      avatarUrl = renderAvatarPresetDataUri(preset);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    const metadata = {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
    };
    const supabase = await createClient();
    const { error: metadataError } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (metadataError) {
      console.error("Failed to sync Supabase user metadata:", metadataError.message);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return serverErrorResponse("Profile update error", error);
  }
}
