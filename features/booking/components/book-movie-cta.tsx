"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShowtimesForMovieQuery } from "../queries";

interface BookMovieCtaProps {
  tmdbMovieId: number;
}

export function BookMovieCta({ tmdbMovieId }: BookMovieCtaProps) {
  const { data: showtimes, isLoading } = useShowtimesForMovieQuery(tmdbMovieId);

  if (isLoading || !showtimes || showtimes.length === 0) return null;

  return (
    <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
      <Link href={`/movies/${tmdbMovieId}/book`}>
        <Ticket className="w-4 h-4" />
        Book Movie
      </Link>
    </Button>
  );
}
