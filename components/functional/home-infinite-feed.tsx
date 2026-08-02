"use client";

import { useEffect, useRef } from "react";
import { InfiniteMovieGrid } from "@/components/functional/infinite-movie-grid";
import { useInfiniteMoviesByCategory } from "@/features/media/queries";
import { useInfinitePopularTVShows } from "@/features/media/queries";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/format";
import { motion } from "framer-motion";
import type { Movie } from "@/features/media/types";
import type { TVShow } from "@/features/media/types";

function useAutoLoadMore(ref: React.RefObject<HTMLDivElement | null>, onLoad?: () => void) {
  useEffect(() => {
    if (!ref.current || !onLoad) return;
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) onLoad();
      });
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, onLoad]);
}

export default function HomeInfiniteFeed() {
  const moviesQuery = useInfiniteMoviesByCategory("popular");
  const tvQuery = useInfinitePopularTVShows();

  const movies = (moviesQuery.data?.pages.flatMap((p) => p.results) ?? []).slice(0, 60);
  const tvshows = (tvQuery.data?.pages.flatMap((p) => p.results) ?? []).slice(0, 60);

  const moviesSentinelRef = useRef<HTMLDivElement>(null);
  const tvSentinelRef = useRef<HTMLDivElement>(null);

  useAutoLoadMore(moviesSentinelRef, () => {
    if (movies.length >= 60) return;
    if (moviesQuery.hasNextPage && !moviesQuery.isFetchingNextPage) {
      moviesQuery.fetchNextPage();
    }
  });

  useAutoLoadMore(tvSentinelRef, () => {
    if (tvshows.length >= 60) return;
    if (tvQuery.hasNextPage && !tvQuery.isFetchingNextPage) {
      tvQuery.fetchNextPage();
    }
  });

  return (
    <motion.div 
      className="space-y-8 sm:space-y-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 text-white">More Popular Movies</h2>
        <InfiniteMovieGrid
          movies={movies as Movie[]}
          isLoading={moviesQuery.isLoading}
          hasNextPage={!!moviesQuery.hasNextPage && movies.length < 60}
          isFetchingNextPage={moviesQuery.isFetchingNextPage}
          onLoadMore={() => {
            if (movies.length >= 60) return;
            moviesQuery.fetchNextPage();
          }}
          showRanking={false}
        />
        <div ref={moviesSentinelRef} className="h-6" />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 text-white">More Popular TV Shows</h2>
        {tvQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {(tvshows as TVShow[]).map((show, index) => (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link href={`/tvshows/${show.id}`} className="group">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                      <Image
                        src={getImageUrl(show.poster_path, "w500")}
                        alt={show.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                      />
                    </div>
                    <div className="mt-2 text-xs sm:text-sm line-clamp-1 text-white/90">{show.name}</div>
                  </Link>
                </motion.div>
              ))}
            </div>
            {tvQuery.hasNextPage && tvshows.length < 60 && (
              <motion.div 
                className="flex justify-center mt-8 sm:mt-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Button
                  onClick={() => {
                    if (tvshows.length >= 60) return;
                    tvQuery.fetchNextPage();
                  }}
                  disabled={tvQuery.isFetchingNextPage}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base"
                >
                  {tvQuery.isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </motion.div>
            )}
            <div ref={tvSentinelRef} className="h-6" />
          </>
        )}
      </motion.section>
    </motion.div>
  );
}


