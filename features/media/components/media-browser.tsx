"use client";

import { useState } from "react";
import { GridSkeleton } from "@/components/general/GridSkeleton";
import { GenreFilter } from "@/features/media/components/genre-filter";
import { BrowseCard, BrowseGrid, LoadMore } from "@/features/media/components/browse-card";
import { useBrowseMovies, useBrowseTVShows } from "@/features/media/queries";
import type { MediaType, Movie, TVShow } from "@/features/media/types";
import { routes } from "@/lib/routes";

interface MediaBrowserProps {
  type: MediaType;
  heading: string;
}

export function MediaBrowser({ type, heading }: MediaBrowserProps) {
  const [genre, setGenre] = useState<string | undefined>(undefined);

  const moviesQuery = useBrowseMovies({ genre });
  const tvQuery = useBrowseTVShows({ genre });
  const query = type === "movie" ? moviesQuery : tvQuery;

  const { isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    query;
  const items = query.data?.items ?? [];

  return (
    <>
      <h2 className="mb-2 text-2xl font-semibold text-white">{heading}</h2>
      <GenreFilter type={type} value={genre} onChange={setGenre} />

      {isLoading ? (
        <GridSkeleton count={18} />
      ) : isError ? (
        <p className="text-white/60">
          We couldn&apos;t load these titles. Please try again.
        </p>
      ) : items.length === 0 ? (
        <p className="text-white/60">Nothing matches this filter.</p>
      ) : (
        <>
          <BrowseGrid>
            {type === "movie"
              ? (items as Movie[]).map((movie) => (
                  <BrowseCard
                    key={movie.id}
                    href={routes.movie(movie.id)}
                    title={movie.title}
                    posterPath={movie.poster_path}
                    rating={movie.vote_average}
                    date={movie.release_date}
                    actionLabel="▶ Play"
                  />
                ))
              : (items as TVShow[]).map((show) => (
                  <BrowseCard
                    key={show.id}
                    href={routes.tvshow(show.id)}
                    title={show.name}
                    posterPath={show.poster_path}
                    rating={show.vote_average}
                    date={show.first_air_date}
                    actionLabel="▶ Watch"
                  />
                ))}
          </BrowseGrid>

          <LoadMore
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          />
        </>
      )}
    </>
  );
}
