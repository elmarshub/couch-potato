import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";
import { generateAuthMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateAuthMetadata("signup");

export default function SignupPage() {
  return <SignupForm />;
}
