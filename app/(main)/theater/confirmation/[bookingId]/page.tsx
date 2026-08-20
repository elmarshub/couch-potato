import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { fetchMediaDetails } from "@/features/media/api";
import { BookingConfirmationView } from "@/features/booking/components/booking-confirmation-view";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function BookingConfirmationPage({ params }: Props) {
  const { bookingId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirectTo=%2Ftheater%2Fconfirmation%2F${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { seats: { include: { seat: true } }, showtime: true },
  });

  if (!booking || booking.userId !== user.id) notFound();

  const movie = await fetchMediaDetails("movie", booking.showtime.tmdbMovieId).catch(
    () => null
  );

  return (
    <main className="min-h-screen bg-[#141414] text-white pt-24 md:pt-28 pb-16">
      <div className="container mx-auto max-w-lg px-4">
        <BookingConfirmationView
          bookingId={booking.id}
          movieTitle={movie?.title ?? "Movie"}
          initialBooking={JSON.parse(JSON.stringify(booking))}
        />
      </div>
    </main>
  );
}
