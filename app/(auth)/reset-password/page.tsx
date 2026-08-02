import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { generateAuthMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateAuthMetadata("reset-password");

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-[420px] animate-pulse rounded-2xl bg-white/5" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
