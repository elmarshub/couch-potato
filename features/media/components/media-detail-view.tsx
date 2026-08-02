"use client";

import Image from "next/image";
import Link from "next/link";
import { formatRating, formatRuntime, getImageUrl, getYear } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  useMediaCredits,
  useMediaDetails,
  useMediaVideos,
} from "@/features/media/queries";
import type { CastMember, MediaType } from "@/features/media/types";
import { FavoriteButton } from "@/components/functional/favoriteButton";
import WatchlistButton from "@/components/functional/watchlistButton";
import { TrailerPlayer } from "@/components/functional/trailer-player";
import { EmptyState } from "@/components/functional/empty-state";
import { cn } from "@/lib/utils";

interface MediaDetailViewProps {
  type: MediaType;
  id: string;
}

export function MediaDetailView({ type, id }: MediaDetailViewProps) {
  const { data: details, isLoading: loadingDetails } = useMediaDetails(type, id);
  const { data: credits } = useMediaCredits(type, id);
  const { data: videos } = useMediaVideos(type, id);

  if (loadingDetails)
    return (
      <main className="min-h-screen bg-[#141414] text-white mt-24 overflow-x-hidden">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="relative h-56 sm:h-72 md:h-96 w-full bg-white/10 animate-pulse rounded" />
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mt-6">
            <div className="w-full md:w-1/3 h-72 sm:h-80 md:h-[500px] bg-white/10 rounded animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-2/3 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );

  if (!details)
    return (
      <main className="min-h-screen bg-[#141414] text-white">
        <EmptyState
          title={type === "movie" ? "Movie not found" : "Show not found"}
          message="We couldn't find that title. It may have been removed or the link is incorrect."
          actionLabel="Back to home"
          actionHref="/"
        />
      </main>
    );

  const officialTrailer = videos?.[0];
  const recommendations = details.recommendations?.results ?? [];
  const title = details.title ?? details.name ?? "Untitled";
  const releaseDate = details.release_date ?? details.first_air_date;
  const seasons = details.number_of_seasons;

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      {details.backdrop_path ? (
        <div className="relative h-56 sm:h-80 md:h-96 w-full">
          <Image
            src={getImageUrl(details.backdrop_path, "original")}
            alt={title}
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/70 to-transparent" />
        </div>
      ) : (
        <div className="h-20 sm:h-24" />
      )}

      <div
        className={cn(
          "container relative z-10 mx-auto max-w-6xl px-4 py-6 sm:py-8",
          details.backdrop_path && "-mt-32 sm:-mt-40 md:-mt-48 lg:-mt-56"
        )}
      >
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="w-full lg:w-1/3 relative h-64 sm:h-72 md:h-80 lg:h-[500px] flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={getImageUrl(details.poster_path)}
              alt={title}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{title}</h1>

            {details.tagline && (
              <p className="italic text-gray-400 text-sm -mt-2">{details.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-300">
              <span className="flex items-center gap-1 font-medium text-yellow-400">
                ⭐ {formatRating(details.vote_average)}
              </span>
              {getYear(releaseDate) && (
                <>
                  <span className="text-gray-500">•</span>
                  <span>{getYear(releaseDate)}</span>
                </>
              )}
              {type === "movie" && formatRuntime(details.runtime) && (
                <>
                  <span className="text-gray-500">•</span>
                  <span>{formatRuntime(details.runtime)}</span>
                </>
              )}
              {type === "tv" && Boolean(seasons) && (
                <>
                  <span className="text-gray-500">•</span>
                  <span>
                    {seasons} Season{seasons === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </div>

            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {details.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 text-xs rounded-full bg-white/10 text-gray-200"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {details.overview}
            </p>

            <div className="flex gap-4">
              <FavoriteButton mediaId={details.id} mediaType={type} />
              <WatchlistButton mediaId={details.id} mediaType={type} />
            </div>

            {officialTrailer && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">Official Trailer</h2>
                <TrailerPlayer videoKey={officialTrailer.key} title={title} />
              </div>
            )}

            {credits && credits.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">Cast</h2>
                <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                  {credits.slice(0, 6).map((cast: CastMember) => (
                    <Link
                      href={`/person/${cast.id}`}
                      key={cast.id}
                      className="w-24 sm:w-28 flex-shrink-0 text-center"
                      prefetch
                    >
                      <div className="relative w-24 h-32 sm:w-28 sm:h-36 rounded overflow-hidden shadow hover:scale-105 transition-transform">
                        <Image
                          src={getImageUrl(cast.profile_path ?? null)}
                          alt={cast.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm mt-1 font-medium">{cast.name}</p>
                      <p className="text-xs text-gray-400">{cast.character}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-3">Related</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {recommendations.slice(0, 12).map((m) => (
                    <Link href={routes.media(type, m.id)} key={m.id} className="group relative">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                        <Image
                          src={getImageUrl(m.poster_path, "w500")}
                          alt={m.title ?? m.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="mt-2 text-sm line-clamp-1">{m.title ?? m.name}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
