"use client";

import { useState, useEffect } from "react";
import { MovieCarouselSlide } from "./MovieCarouselSlide";
import { MovieCarouselControls } from "./MovieCarouselControls";
import { MovieCarouselContent } from "./MovieCarouselContent";
import { Movie } from "@/features/media/types";

interface MovieCarouselProps {
  movies: Movie[];
}

export function MovieCarousel({ movies }: MovieCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const displayMovies = movies?.slice(0, 8) || [];

  useEffect(() => {
    if (!displayMovies.length || isPaused) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % displayMovies.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [displayMovies.length, isPaused]);

  if (!displayMovies.length) {
    return (
      <div className="h-[70vh] flex items-center justify-center bg-[#141414]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading featured content...</p>
        </div>
      </div>
    );
  }

  const currentMovie = displayMovies[index];

  return (
    <section
      className="relative w-full h-[75vh] md:h-[76vh] lg:h-[80vh] xl:h-[85vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <MovieCarouselSlide movies={displayMovies} currentIndex={index} />

      <MovieCarouselContent movie={currentMovie} />

      <MovieCarouselControls
        movies={displayMovies}
        currentIndex={index}
        onSlideChange={setIndex}
      />
    </section>
  );
}
