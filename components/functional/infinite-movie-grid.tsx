"use client";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl, getYear } from "@/lib/format";
import type { Movie } from "@/features/media/types";

interface InfiniteMovieGridProps {
  movies: Movie[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  showRanking?: boolean;
}

export function InfiniteMovieGrid({
  movies,
  isLoading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  showRanking = true,
}: InfiniteMovieGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/60">
        <p className="text-lg">No movies found</p>
        <p className="text-sm mt-2">Try selecting a different category</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie, index) => (
          <Link
            key={`${movie.id}-${index}`}
            href={`/movies/${movie.id}`}
            className="group relative"
          >
            {showRanking && (
              <div className="absolute -left-2 -top-2 z-10 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {index + 1}
              </div>
            )}

            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={
                  getImageUrl(movie.poster_path, "w500") || "/placeholder.svg"
                }
                alt={movie.title}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
                    <span className="flex items-center gap-1">
                      ⭐ {movie.vote_average.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{getYear(movie.release_date)}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    ▶ Play
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-2 md:hidden">
              <h3 className="text-white text-sm font-medium line-clamp-1">
                {movie.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                <span>⭐ {movie.vote_average.toFixed(1)}</span>
                <span>•</span>
                <span>{getYear(movie.release_date)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {hasNextPage && onLoadMore && (
        <div className="flex justify-center mt-12">
          <Button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            size="lg"
            className="bg-red-600 hover:bg-red-700 cursor-pointer text-white px-8"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
