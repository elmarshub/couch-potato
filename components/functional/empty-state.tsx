import Link from "next/link";
import { Film, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon = Film,
  title,
  message,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <Icon className="h-8 w-8 text-[#E50914]" />
      </span>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="max-w-md text-white/60">{message}</p>
      {actionLabel && actionHref && (
        <Button
          asChild
          className="mt-2 bg-[#E50914] font-medium text-white hover:bg-[#E50914]/80"
        >
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
