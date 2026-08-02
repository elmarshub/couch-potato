"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  libraryErrorMessage,
  useIsFavorite,
  useToggleFavorite,
} from "@/features/library/queries";
import type { MediaType } from "@/features/media/types";
import { useAuthContext } from "@/providers/auth-provider";
import { routes } from "@/lib/routes";

interface FavoriteButtonProps {
  mediaId: number;
  mediaType: MediaType;
}

export function FavoriteButton({ mediaId, mediaType }: FavoriteButtonProps) {
  const isFavorite = useIsFavorite(mediaId, mediaType);
  const toggleFavorite = useToggleFavorite();
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Sign in to like titles");
      router.push(routes.loginWithRedirect(window.location.pathname));
      return;
    }

    toggleFavorite.mutate(
      { mediaId, mediaType, isActive: isFavorite },
      {
        onSuccess: () =>
          toast.success(isFavorite ? "Removed from likes" : "Added to likes"),
        onError: (error) =>
          toast.error(libraryErrorMessage(error, "Could not update likes")),
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from likes" : "Add to likes"}
      className="cursor-pointer p-2 disabled:opacity-60"
    >
      <Heart
        className={`h-6 w-6 transition-colors duration-200 ${
          isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
        }`}
      />
    </button>
  );
}
