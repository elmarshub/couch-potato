import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fetchMediaDetails } from "@/features/media/api";
import { mapWithConcurrency } from "@/lib/concurrency";
import { ShowsTable, type ShowRow } from "@/features/admin/components/shows-table";

const TMDB_FETCH_CONCURRENCY = 8;

export default async function AdminShowsPage() {
  const showtimes = await prisma.showtime.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      bookings: {
        where: { status: "PAID" },
        select: { amountCents: true },
      },
    },
    take: 300,
  });

  const uniqueMovieIds = Array.from(
    new Set(showtimes.map((s) => s.tmdbMovieId))
  );
  const movieEntries = await mapWithConcurrency(
    uniqueMovieIds,
    TMDB_FETCH_CONCURRENCY,
    async (id) => [id, await fetchMediaDetails("movie", id).catch(() => null)] as const
  );
  const movieById = new Map(movieEntries);

  const rows: ShowRow[] = showtimes.map((showtime) => ({
    id: showtime.id,
    movieTitle:
      movieById.get(showtime.tmdbMovieId)?.title ?? `TMDB #${showtime.tmdbMovieId}`,
    startsAt: showtime.startsAt.toISOString(),
    totalBookings: showtime.bookings.length,
    earningsCents: showtime.bookings.reduce((sum, b) => sum + b.amountCents, 0),
    isCancelled: showtime.isCancelled,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Shows</h2>
        <Link
          href="/admin/add-shows"
          className="inline-flex items-center rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          Add show
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-400">No shows yet.</p>
      ) : (
        <ShowsTable rows={rows} />
      )}
    </div>
  );
}
