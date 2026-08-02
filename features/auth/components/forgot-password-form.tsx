"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
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
import { requestPasswordResetAction } from "../actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { AuthShell } from "./auth-shell";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordInput) => {
    startTransition(async () => {
      await requestPasswordResetAction(values);
      setSentTo(values.email);
    });
  };

  if (sentTo) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="If that account exists, a reset link is on its way"
        footer={{ prompt: "Remembered it?", linkLabel: "Sign in", href: "/login" }}
      >
        <div className="space-y-5 text-center">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <MailCheck className="h-7 w-7 text-emerald-400" />
            </span>
          </div>
          <p className="text-sm text-white/70">
            We sent a password reset link to{" "}
            <span className="font-semibold text-white">{sentTo}</span> if it
            matches an account. The link expires shortly, so use it soon.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={{ prompt: "Remembered it?", linkLabel: "Sign in", href: "/login" }}
    >
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

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full cursor-pointer bg-[#E50914] text-base font-semibold text-white transition-colors hover:bg-[#E50914]/80"
          >
            {isPending ? <Spinner className="size-5" /> : "Send reset link"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
