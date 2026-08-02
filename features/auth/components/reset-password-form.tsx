"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
import { Spinner } from "@/components/ui/spinner";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordAction } from "../actions";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { AuthShell } from "./auth-shell";
import { FormAlert } from "./form-alert";
import { PasswordField } from "./password-field";
import { PasswordRequirements } from "./password-requirements";

const VERIFY_TIMEOUT_MS = 8000;

function useRecoverySession() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"verifying" | "ready" | "invalid">(
    "verifying"
  );

  useEffect(() => {
    let settled = false;

    const markReady = () => {
      if (settled) return;
      settled = true;
      setStatus("ready");
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") markReady();
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setStatus("invalid");
      }
    }, VERIFY_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  return status;
}

export function ResetPasswordForm() {
  const status = useRecoverySession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  });

  const password = form.watch("password");

  const onSubmit = (values: ResetPasswordInput) => {
    setFormError(null);

    startTransition(async () => {
      const result = await resetPasswordAction(values);

      if (result.status === "error") {
        setFormError(result.error.message);
        for (const [field, message] of Object.entries(
          result.error.fieldErrors ?? {}
        )) {
          form.setError(field as keyof ResetPasswordInput, { message });
        }
        return;
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success("Password updated");
      router.replace("/");
      router.refresh();
    });
  };

  if (status === "verifying") {
    return (
      <AuthShell
        title="Verifying link"
        subtitle="Hang on while we confirm your reset link"
        footer={{ prompt: "Wrong page?", linkLabel: "Sign in", href: "/login" }}
      >
        <div className="flex justify-center py-6">
          <Spinner className="size-6" />
        </div>
      </AuthShell>
    );
  }

  if (status === "invalid") {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This password reset link is invalid or has already been used"
        footer={{
          prompt: "Need a new one?",
          linkLabel: "Request another link",
          href: "/forgot-password",
        }}
      >
        <FormAlert tone="error">
          Reset links expire shortly after they&apos;re sent. Request a fresh one
          to continue.
        </FormAlert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your account"
      footer={{ prompt: "Changed your mind?", linkLabel: "Sign in", href: "/login" }}
    >
      {formError && <FormAlert tone="error">{formError}</FormAlert>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">New password</FormLabel>
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
            {isPending ? <Spinner className="size-5" /> : "Update password"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
