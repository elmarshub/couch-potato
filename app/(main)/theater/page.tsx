import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { fetchMediaDetails } from "@/features/media/api";
import { getImageUrl } from "@/lib/format";
import { EmptyState } from "@/components/functional/empty-state";
import { Ticket } from "lucide-react";

export default async function BookingsPage() {
  const showtimes = await prisma.showtime.findMany({
    where: { isCancelled: false, startsAt: { gt: new Date() } },
    select: { tmdbMovieId: true },
    distinct: ["tmdbMovieId"],
  });

  const movies = await Promise.all(
    showtimes.map(async ({ tmdbMovieId }) => {
      try {
        return await fetchMediaDetails("movie", tmdbMovieId);
      } catch {
        return null;
      }
    })
  );
  const validMovies = movies.filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <main className="min-h-screen bg-[#141414] text-white pt-24 md:pt-28 pb-16">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Now Showing</h1>

        {validMovies.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="Nothing to book yet"
            message="There are no movies currently available for booking. Check back soon."
            actionLabel="Browse movies"
            actionHref="/movies"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {validMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.id}/book`}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                  <Image
                    src={getImageUrl(movie.poster_path, "w500")}
                    alt={movie.title ?? "Movie poster"}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="mt-2 text-sm line-clamp-1">{movie.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
