import type { User as PrismaUser } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "./server";

export async function getCurrentUser(
  token?: string,
): Promise<PrismaUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !authUser?.email) {
    return null;
  }

  try {
    return await prisma.user.upsert({
      where: { id: authUser.id },
      update: { email: authUser.email },
      create: {
        id: authUser.id,
        email: authUser.email,
        name:
          typeof authUser.user_metadata?.name === "string"
            ? authUser.user_metadata.name
            : null,
        avatarUrl:
          typeof authUser.user_metadata?.avatar_url === "string"
            ? authUser.user_metadata.avatar_url
            : null,
      },
    });
  } catch (error) {
    const wrapped = new Error("DB_UNAVAILABLE");
    wrapped.cause = error;
    throw wrapped;
  }
}
