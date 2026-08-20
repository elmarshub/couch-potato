import { prisma } from "@/lib/prisma";
import { fetchMediaDetails } from "@/features/media/api";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      showtime: true,
      seats: { include: { seat: true } },
    },
    take: 300,
  });

  const uniqueMovieIds = Array.from(
    new Set(bookings.map((b) => b.showtime.tmdbMovieId))
  );
  const movieEntries = await Promise.all(
    uniqueMovieIds.map(
      async (id) => [id, await fetchMediaDetails("movie", id).catch(() => null)] as const
    )
  );
  const movieById = new Map(movieEntries);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Bookings</h2>

      {bookings.length === 0 ? (
        <p className="text-gray-400">No bookings yet.</p>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wide">
                <th className="py-3 px-4 font-medium">User name</th>
                <th className="py-3 px-4 font-medium">Movie name</th>
                <th className="py-3 px-4 font-medium">Showtime</th>
                <th className="py-3 px-4 font-medium">Seats</th>
                <th className="py-3 px-4 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((booking) => {
                const movie = movieById.get(booking.showtime.tmdbMovieId);
                return (
                  <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      {booking.user.name ?? booking.user.email}
                    </td>
                    <td className="py-3 px-4">
                      {movie?.title ?? `TMDB #${booking.showtime.tmdbMovieId}`}
                    </td>
                    <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                      {new Date(booking.showtime.startsAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {booking.seats
                        .map((bs) => `${bs.seat.row}${bs.seat.number}`)
                        .join(", ")}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      ${(booking.amountCents / 100).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
