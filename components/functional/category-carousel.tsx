"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/features/media/types";
import { getImageUrl, getYear } from "@/lib/format";
import { motion } from "framer-motion";

interface CategoryCarouselProps {
  title: string;
  movies: Movie[];
  categoryId: string;
}

export function CategoryCarousel({
  title,
  movies,
  categoryId,
}: CategoryCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 400;
    const newScrollLeft =
      scrollContainerRef.current.scrollLeft +
      (direction === "left" ? -scrollAmount : scrollAmount);

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });

    setTimeout(() => {
      if (!scrollContainerRef.current) return;
      setShowLeftArrow(scrollContainerRef.current.scrollLeft > 0);
      setShowRightArrow(
        scrollContainerRef.current.scrollLeft <
          scrollContainerRef.current.scrollWidth -
            scrollContainerRef.current.clientWidth -
            10
      );
    }, 300);
  };

  return (
    <motion.section
      className="py-6 sm:py-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="flex items-center justify-between mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            {title}
            {title.includes("Trending") && (
              <span className="text-xl sm:text-2xl">🔥</span>
            )}
          </h2>
          <Link href={`/category/${categoryId}`} prefetch>
            <Button
              variant="ghost"
              className="text-white hover:text-red-500 gap-2 group cursor-pointer text-sm sm:text-base"
            >
              More
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          className="relative group"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {showLeftArrow && (
            <motion.button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 sm:w-12 h-full bg-gradient-to-r from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-1 sm:pl-2"
              aria-label="Scroll left"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </motion.button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {movies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] group/card"
              >
                <Link href={`/movies/${movie.id}`}>
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                    <Image
                      src={
                        getImageUrl(movie.poster_path, "w500") ||
                        "/placeholder.svg"
                      }
                      alt={movie.title}
                      fill
                      className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, (max-width: 1024px) 180px, 200px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                        <h3 className="text-white font-semibold text-xs sm:text-sm line-clamp-2 mb-1">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-white/80">
                          <span>⭐ {movie.vote_average.toFixed(1)}</span>
                          <span>•</span>
                          <span>{getYear(movie.release_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {showRightArrow && (
            <motion.button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 sm:w-12 h-full bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-1 sm:pr-2"
              aria-label="Scroll right"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
