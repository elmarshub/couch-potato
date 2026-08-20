"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { fetchNowPlayingMovies } from "@/features/media/api";
import { getImageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Movie } from "@/features/media/types";

interface NowPlayingPickerProps {
  value: Movie | null;
  onChange: (movie: Movie) => void;
}

export function NowPlayingPicker({ value, onChange }: NowPlayingPickerProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "tmdb-now-playing"],
    queryFn: () => fetchNowPlayingMovies(1),
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-28 h-40 flex-shrink-0 bg-white/10 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 py-4">
        <p className="text-sm text-gray-400">Couldn&apos;t load now-playing movies.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm text-red-400 hover:text-red-300 cursor-pointer underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {data?.results.map((movie) => {
        const isSelected = value?.id === movie.id;
        return (
          <button
            key={movie.id}
            type="button"
            onClick={() => onChange(movie)}
            className={cn(
              "flex-shrink-0 w-28 text-left group cursor-pointer",
              isSelected && "ring-2 ring-red-600 rounded-lg"
            )}
          >
            <div className="relative w-28 h-40 rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={getImageUrl(movie.poster_path, "w200")}
                alt={movie.title}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="mt-1 text-xs line-clamp-2">{movie.title}</p>
          </button>
        );
      })}
    </div>
  );
}
