"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  libraryErrorMessage,
  useIsInWatchlist,
  useToggleWatchlist,
} from "@/features/library/queries";
import type { MediaType } from "@/features/media/types";
import { useAuthContext } from "@/providers/auth-provider";
import { routes } from "@/lib/routes";

interface WatchlistButtonProps {
  mediaId: number;
  mediaType: MediaType;
}

export default function WatchlistButton({
  mediaId,
  mediaType,
}: WatchlistButtonProps) {
  const isInWatchlist = useIsInWatchlist(mediaId, mediaType);
  const toggleWatchlist = useToggleWatchlist();
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Sign in to save titles");
      router.push(routes.loginWithRedirect(window.location.pathname));
      return;
    }

    toggleWatchlist.mutate(
      { mediaId, mediaType, isActive: isInWatchlist },
      {
        onSuccess: () =>
          toast.success(
            isInWatchlist ? "Removed from watchlist" : "Added to watchlist"
          ),
        onError: (error) =>
          toast.error(libraryErrorMessage(error, "Could not update watchlist")),
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleWatchlist.isPending}
      aria-pressed={isInWatchlist}
      aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      className="cursor-pointer p-2 disabled:opacity-60"
    >
      <Bookmark
        className={`h-6 w-6 transition-colors duration-200 ${
          isInWatchlist ? "fill-yellow-500 text-yellow-500" : "text-gray-400"
        }`}
      />
    </button>
  );
}
