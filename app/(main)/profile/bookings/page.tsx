import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { fetchMediaDetails } from "@/features/media/api";
import { getImageUrl } from "@/lib/format";
import { EmptyState } from "@/components/functional/empty-state";
import { PayNowButton } from "@/features/booking/components/pay-now-button";
import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function MyBookingsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=%2Fprofile%2Fbookings");

  const { page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where = {
    userId: user.id,
    OR: [
      { status: "PAID" as const },
      { status: "PENDING" as const, expiresAt: { gt: new Date() } },
    ],
  };

  const [totalCount, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: { showtime: true, seats: { include: { seat: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const movies = await Promise.all(
    bookings.map((b) =>
      fetchMediaDetails("movie", b.showtime.tmdbMovieId).catch(() => null)
    )
  );

  return (
    <main className="min-h-screen bg-[#141414] text-white pt-24 md:pt-28 pb-16">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No bookings yet"
            message="Once you book tickets for a movie, they'll show up here."
            actionLabel="Browse theater"
            actionHref="/theater"
          />
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking, i) => {
                const movie = movies[i];
                return (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row gap-4 rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex gap-4 flex-1 min-w-0">
                      {movie?.poster_path && (
                        <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                          <Image
                            src={getImageUrl(movie.poster_path, "w200")}
                            alt={movie.title ?? "Movie poster"}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{movie?.title ?? "Unknown movie"}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(booking.showtime.startsAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          Seats:{" "}
                          {booking.seats
                            .map((bs) => `${bs.seat.row}${bs.seat.number}`)
                            .join(", ")}{" "}
                          ({booking.seats.length} seat
                          {booking.seats.length === 1 ? "" : "s"})
                        </p>
                        <p className="text-sm font-medium mt-1">
                          ${(booking.amountCents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-2 flex-shrink-0">
                      <span
                        className={
                          booking.status === "PAID"
                            ? "text-xs text-green-400"
                            : "text-xs text-yellow-400"
                        }
                      >
                        {booking.status === "PAID" ? "Paid" : "Pending payment"}
                      </span>
                      {booking.status === "PENDING" && (
                        <PayNowButton bookingId={booking.id} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Booking history pages"
                className="flex items-center justify-center gap-2 mt-8"
              >
                <Link
                  href={`/profile/bookings?page=${page - 1}`}
                  aria-disabled={page <= 1}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm border border-white/10 transition-colors",
                    page <= 1
                      ? "pointer-events-none text-gray-600"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  Previous
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/profile/bookings?page=${p}`}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors",
                      p === page
                        ? "bg-red-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {p}
                  </Link>
                ))}

                <Link
                  href={`/profile/bookings?page=${page + 1}`}
                  aria-disabled={page >= totalPages}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm border border-white/10 transition-colors",
                    page >= totalPages
                      ? "pointer-events-none text-gray-600"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  Next
                </Link>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
