"use client";

import { useState, useEffect } from "react";
import { TvCarouselSlide } from "./TvCarouselSlide";
import { TvCarouselControls } from "./TvCarouselControls";
import { TvCarouselContent } from "./TvCarouselContent";
import { TVShow } from "@/features/media/types";

interface TvCarouselProps {
  tvshows: TVShow[];
}

export function TvCarousel({ tvshows }: TvCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const displayShows = tvshows?.slice(0, 8) || [];

  useEffect(() => {
    if (!displayShows.length || isPaused) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % displayShows.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [displayShows.length, isPaused]);

  if (!displayShows.length) {
    return (
      <div className="h-[70vh] flex items-center justify-center bg-[#141414]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading featured TV shows...</p>
        </div>
      </div>
    );
  }

  const currentShow = displayShows[index];

  return (
    <section
      className="relative w-full h-[70vh] md:h-[75vh] lg:h-[80vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <TvCarouselSlide
        shows={displayShows}
        currentIndex={index}
      />
      
      <TvCarouselContent show={currentShow} />
      
      <TvCarouselControls
        shows={displayShows}
        currentIndex={index}
        onSlideChange={setIndex}
      />
    </section>
  );
}
