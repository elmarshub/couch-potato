"use client";

import Link from "next/link";
import { useShowtimesForMovieQuery } from "../queries";
import { EmptyState } from "@/components/functional/empty-state";

interface ShowtimeListProps {
  tmdbMovieId: number;
}

export function ShowtimeList({ tmdbMovieId }: ShowtimeListProps) {
  const { data: showtimes, isLoading } = useShowtimesForMovieQuery(tmdbMovieId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!showtimes || showtimes.length === 0) {
    return (
      <EmptyState
        title="No showtimes available"
        message="There are no upcoming showtimes for this movie right now."
        actionLabel="Back to movie"
        actionHref={`/movies/${tmdbMovieId}?type=movie`}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {showtimes.map((showtime) => {
        const minPrice = Math.min(...showtime.seatPrices.map((p) => p.priceCents));
        return (
          <Link
            key={showtime.id}
            href={`/movies/${tmdbMovieId}/book/${showtime.id}/seats`}
            className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
          >
            <p className="font-medium">
              {new Date(showtime.startsAt).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-gray-300 text-sm">
              {new Date(showtime.startsAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              From ${(minPrice / 100).toFixed(2)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
