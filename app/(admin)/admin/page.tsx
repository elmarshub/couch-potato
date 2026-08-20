import Link from "next/link";
import { Ticket, DollarSign, Clapperboard, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fetchMediaDetails } from "@/features/media/api";

async function getDashboardData() {
  const now = new Date();

  const [totalBookings, revenue, activeShows, totalUsers, activeShowtimes] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { status: "PAID" },
        _sum: { amountCents: true },
      }),
      prisma.showtime.count({
        where: { isCancelled: false, startsAt: { gt: now } },
      }),
      prisma.user.count(),
      prisma.showtime.findMany({
        where: { isCancelled: false, startsAt: { gt: now } },
        orderBy: { startsAt: "asc" },
        include: { seatPrices: true },
        take: 20,
      }),
    ]);

  return {
    totalBookings,
    totalRevenueCents: revenue._sum.amountCents ?? 0,
    activeShows,
    totalUsers,
    activeShowtimes,
  };
}

export default async function AdminDashboardPage() {
  const { totalBookings, totalRevenueCents, activeShows, totalUsers, activeShowtimes } =
    await getDashboardData();

  const movies = await Promise.all(
    activeShowtimes.map((s) =>
      fetchMediaDetails("movie", s.tmdbMovieId).catch(() => null)
    )
  );

  const cards = [
    { label: "Total Bookings", value: totalBookings.toLocaleString(), icon: Ticket },
    {
      label: "Total Revenue",
      value: `$${(totalRevenueCents / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`,
      icon: DollarSign,
    },
    { label: "Active Shows", value: activeShows.toLocaleString(), icon: Clapperboard },
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-white/10 bg-white/5 p-5 flex items-start justify-between"
            >
              <div>
                <p className="text-sm text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <span className="flex items-center justify-center w-9 h-9 rounded-md bg-red-600/15 text-red-400">
                <Icon className="w-4 h-4" />
              </span>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active shows</h2>
          <Link href="/admin/shows" className="text-sm text-blue-400 hover:underline">
            View all
          </Link>
        </div>

        {activeShowtimes.length === 0 ? (
          <p className="text-gray-400 text-sm">No active shows right now.</p>
        ) : (
          <div className="rounded-lg border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[560px]">
              <thead className="bg-white/5">
                <tr className="text-gray-400">
                  <th className="py-2 px-4 font-medium">Movie</th>
                  <th className="py-2 px-4 font-medium">Showtime</th>
                  <th className="py-2 px-4 font-medium">Prices</th>
                </tr>
              </thead>
              <tbody>
                {activeShowtimes.map((showtime, i) => (
                  <tr key={showtime.id} className="border-t border-white/10">
                    <td className="py-2 px-4">
                      {movies[i]?.title ?? `TMDB #${showtime.tmdbMovieId}`}
                    </td>
                    <td className="py-2 px-4 text-gray-300 whitespace-nowrap">
                      {new Date(showtime.startsAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-gray-300 whitespace-nowrap">
                      {showtime.seatPrices
                        .map((p) => `${p.tier} $${(p.priceCents / 100).toFixed(2)}`)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
