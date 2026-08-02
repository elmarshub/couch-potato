"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Link from "next/link";
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
import { resendConfirmationAction, signInAction } from "../actions";
import { loginSchema, type LoginInput } from "../schemas";
import { AuthShell } from "./auth-shell";
import { FormAlert } from "./form-alert";
import { PasswordField } from "./password-field";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const onSubmit = (values: LoginInput) => {
    setFormError(null);
    setNeedsConfirmation(false);

    startTransition(async () => {
      const result = await signInAction({ ...values, redirectTo });

      if (result.status === "error") {
        const { error } = result;
        setFormError(error.message);
        setNeedsConfirmation(error.code === "email_not_confirmed");

        for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
          form.setError(field as keyof LoginInput, { message });
        }
        form.resetField("password", { keepError: true });
        return;
      }

      if (result.status === "success") {
        await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
        toast.success("Welcome back");
        router.replace(result.redirectTo);
        router.refresh();
      }
    });
  };

  const handleResend = async () => {
    const email = form.getValues("email");
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
      title="Welcome back"
      subtitle="Sign in to reach your watchlist and likes"
      footer={{
        prompt: "Don't have an account?",
        linkLabel: "Sign up",
        href: "/signup",
      }}
    >
      {formError && (
        <FormAlert
          tone="error"
          action={
            needsConfirmation ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="cursor-pointer font-semibold underline underline-offset-4 disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend confirmation email"}
              </button>
            ) : undefined
          }
        >
          {formError}
        </FormAlert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                <div className="flex items-center justify-between">
                  <FormLabel className="text-white">Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordField
                    {...field}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full cursor-pointer bg-[#E50914] text-base font-semibold text-white transition-colors hover:bg-[#E50914]/80"
          >
            {isPending ? <Spinner className="size-5" /> : "Sign in"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
