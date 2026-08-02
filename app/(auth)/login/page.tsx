import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { generateAuthMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateAuthMetadata("login");

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[520px] animate-pulse rounded-2xl bg-white/5" />}>
      <LoginForm />
    </Suspense>
  );
}
