"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { rateLimit } from "@/lib/api/guards";
import { authFailure, mapAuthError, type AuthFailure } from "./errors";
import {
  forgotPasswordSchema,
  loginSchema,
  resendConfirmationSchema,
  resetPasswordSchema,
  signupSchema,
} from "./schemas";

async function requestIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return hdrs.get("x-real-ip") ?? "unknown";
}

export type AuthActionResult =
  | { status: "success"; redirectTo: string }
  | { status: "confirm-email"; email: string }
  | { status: "error"; error: AuthFailure };

function safeRedirect(target: unknown): string {
  if (typeof target !== "string") return "/";
  if (!target.startsWith("/") || target.startsWith("//")) return "/";
  return target;
}

export async function signInAction(input: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: AuthFailure["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] ??= issue.message;
      }
    }
    return {
      status: "error",
      error: { ...authFailure("validation"), fieldErrors },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", error: mapAuthError(error) };
  }

  await getCurrentUser();
  revalidatePath("/", "layout");

  return { status: "success", redirectTo: safeRedirect(input.redirectTo) };
}

export async function signUpAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: AuthFailure["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email" || field === "password") {
        fieldErrors[field] ??= issue.message;
      }
    }
    return {
      status: "error",
      error: { ...authFailure("validation"), fieldErrors },
    };
  }

  const { name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { status: "error", error: mapAuthError(error) };
  }

  if (!data.session) {
    return { status: "confirm-email", email };
  }

  await getCurrentUser();
  revalidatePath("/", "layout");

  return { status: "success", redirectTo: "/" };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

export async function resendConfirmationAction(input: {
  email: string;
}): Promise<{ status: "success" } | { status: "error"; error: AuthFailure }> {
  const parsed = resendConfirmationSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", error: authFailure("validation") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
  });

  if (error) {
    return { status: "error", error: mapAuthError(error) };
  }
  return { status: "success" };
}

export async function requestPasswordResetAction(input: {
  email: string;
}): Promise<{ status: "success" } | { status: "error"; error: AuthFailure }> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", error: authFailure("validation") };
  }

  const ip = await requestIp();
  const { allowed } = rateLimit(`password-reset:${ip}:${parsed.data.email}`, {
    limit: 3,
    windowMs: 15 * 60_000,
  });
  if (allowed) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${appUrl}/reset-password`,
    });
    if (error) {
      console.error("[password-reset] resetPasswordForEmail failed:", error.message);
    }
  }

  return { status: "success" };
}

export async function resetPasswordAction(input: {
  password: string;
}): Promise<{ status: "success" } | { status: "error"; error: AuthFailure }> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: AuthFailure["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "password") {
        fieldErrors.password ??= issue.message;
      }
    }
    return {
      status: "error",
      error: { ...authFailure("validation"), fieldErrors },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", error: mapAuthError(error) };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
