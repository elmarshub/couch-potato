"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { queryKeys } from "@/lib/query-keys";
import { resendConfirmationAction, signUpAction } from "../actions";
import { signupSchema, type SignupInput } from "../schemas";
import { AuthShell } from "./auth-shell";
import { FormAlert } from "./form-alert";
import { PasswordField } from "./password-field";
import { PasswordRequirements } from "./password-requirements";

function ConfirmEmailNotice({ email }: { email: string }) {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await resendConfirmationAction({ email });
      if (result.status === "success") {
        toast.success("Confirmation email sent");
      } else {
        toast.error(result.error.message);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="One more step before you can sign in"
      footer={{
        prompt: "Already confirmed?",
        linkLabel: "Sign in",
        href: "/login",
      }}
    >
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <MailCheck className="h-7 w-7 text-emerald-400" />
          </span>
        </div>
        <p className="text-sm text-white/70">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-white">{email}</span>. Open it to
          activate your account.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="h-12 w-full cursor-pointer bg-[#E50914] text-base font-semibold text-white hover:bg-[#E50914]/80"
          >
            <Link href="/login">Go to sign in</Link>
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="cursor-pointer text-sm text-white/60 underline underline-offset-4 hover:text-white disabled:opacity-60"
          >
            {resending ? "Sending..." : "Resend confirmation email"}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

export function SignupForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", password: "" },
  });

  const password = form.watch("password");

  const onSubmit = (values: SignupInput) => {
    setFormError(null);

    startTransition(async () => {
      const result = await signUpAction(values);

      if (result.status === "error") {
        setFormError(result.error.message);
        for (const [field, message] of Object.entries(
          result.error.fieldErrors ?? {}
        )) {
          form.setError(field as keyof SignupInput, { message });
        }
        return;
      }

      if (result.status === "confirm-email") {
        setConfirmationEmail(result.email);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success("Account created");
      router.replace(result.redirectTo);
      router.refresh();
    });
  };

  if (confirmationEmail) {
    return <ConfirmEmailNotice email={confirmationEmail} />;
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track everything you want to watch"
      footer={{
        prompt: "Already have an account?",
        linkLabel: "Sign in",
        href: "/login",
      }}
    >
      {formError && <FormAlert tone="error">{formError}</FormAlert>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Full name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    className="glass-input h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="glass-input h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Password</FormLabel>
                <FormControl>
                  <PasswordField
                    {...field}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </FormControl>
                <PasswordRequirements password={password} />
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full cursor-pointer bg-[#E50914] text-base font-semibold text-white transition-colors hover:bg-[#E50914]/80"
          >
            {isPending ? <Spinner className="size-5" /> : "Create account"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
