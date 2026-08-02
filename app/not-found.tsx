import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/functional/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#141414] text-white">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        message="The page you're looking for doesn't exist or may have been moved."
        actionLabel="Back to home"
        actionHref="/"
      />
    </main>
  );
}
