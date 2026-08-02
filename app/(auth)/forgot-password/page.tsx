import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { generateAuthMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateAuthMetadata("forgot-password");

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="h-[420px] animate-pulse rounded-2xl bg-white/5" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
