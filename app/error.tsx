"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#141414] px-4 text-center text-white">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <AlertTriangle className="h-8 w-8 text-[#E50914]" />
      </span>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-white/60">
        An unexpected error occurred. Try again, or head back to the home page.
      </p>
      <div className="mt-2 flex gap-3">
        <Button
          onClick={reset}
          className="cursor-pointer bg-[#E50914] font-medium text-white hover:bg-[#E50914]/80"
        >
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
