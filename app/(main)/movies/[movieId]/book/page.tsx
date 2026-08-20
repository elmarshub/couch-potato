import Link from "next/link";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { fetchMediaDetails } from "@/features/media/api";
import { ShowtimeList } from "@/features/booking/components/showtime-list";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ movieId: string }>;
}

export default async function BookMoviePage({ params }: Props) {
  const { movieId } = await params;
  const tmdbMovieId = Number(movieId);
  if (!Number.isInteger(tmdbMovieId) || tmdbMovieId <= 0) notFound();

  const queryClient = getQueryClient();
  const [details, showtimes] = await Promise.all([
    fetchMediaDetails("movie", movieId),
    prisma.showtime.findMany({
      where: { tmdbMovieId, isCancelled: false, startsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
      include: { seatPrices: true },
    }),
  ]);
  queryClient.setQueryData(
    queryKeys.booking.showtimesForMovie(tmdbMovieId),
    JSON.parse(JSON.stringify(showtimes))
  );

  return (
    <main className="min-h-screen bg-[#141414] text-white pt-24 md:pt-28 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        <Link
          href="/theater"
          className="text-sm text-gray-400 hover:text-white"
        >
          &larr; Back to theater
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2 mb-6">
          Book tickets for {details.title}
        </h1>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ShowtimeList tmdbMovieId={tmdbMovieId} />
        </HydrationBoundary>
      </div>
    </main>
  );
}
