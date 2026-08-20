"use client";

import { use, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { SeatMap } from "@/features/booking/components/seat-map";
import { useCreateBookingMutation, useSeatMapQuery } from "@/features/booking/queries";
import type { SeatMapSeat } from "@/features/booking/types";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/http";

const MAX_SEATS = 10;

interface Props {
  params: Promise<{ movieId: string; showtimeId: string }>;
}

export default function SelectSeatsPage({ params }: Props) {
  const { movieId, showtimeId } = use(params);
  const { data, isLoading, error } = useSeatMapQuery(showtimeId);
  const [selected, setSelected] = useState<SeatMapSeat[]>([]);
  const createBooking = useCreateBookingMutation();

  const toggleSeat = (seat: SeatMapSeat) => {
    const exists = selected.some((s) => s.id === seat.id);
    if (!exists && selected.length >= MAX_SEATS) {
      toast.error(`You can select up to ${MAX_SEATS} seats`);
      return;
    }
    setSelected((prev) =>
      exists ? prev.filter((s) => s.id !== seat.id) : [...prev, seat]
    );
  };

  const totalCents = selected.reduce((sum, seat) => {
    const price = data?.showtime.seatPrices.find((p) => p.tier === seat.tier);
    return sum + (price?.priceCents ?? 0);
  }, 0);

  const handleBook = async () => {
    if (selected.length === 0) return;
    try {
      const booking = await createBooking.mutateAsync({
        showtimeId,
        seatIds: selected.map((s) => s.id),
      });
      if (booking.checkoutUrl) {
        window.location.href = booking.checkoutUrl;
      } else {
        toast.error("Payment setup failed — find your booking under My Bookings to retry.");
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create booking";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <main className="h-dvh flex flex-col overflow-hidden bg-[#141414] text-white">
        <div className="pt-20 md:pt-24 px-4 flex-shrink-0">
          <div className="container mx-auto max-w-3xl">
            <div className="h-64 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="h-dvh flex flex-col overflow-hidden bg-[#141414] text-white">
        <div className="pt-20 md:pt-24 px-4 flex-shrink-0">
          <div className="container mx-auto max-w-3xl text-center text-gray-400">
            Could not load seat map for this showtime.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col overflow-hidden bg-[#141414] text-white">
      <div className="pt-20 md:pt-24 px-4 flex-shrink-0">
        <div className="container mx-auto max-w-3xl">
          <Link
            href={`/movies/${movieId}/book`}
            className="text-sm text-gray-400 hover:text-white"
          >
            &larr; Back to showtimes
          </Link>
          <h1 className="text-xl md:text-3xl font-bold mt-1 md:mt-2 mb-2 md:mb-6">
            Select your seats
          </h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto px-4">
        <div className="container mx-auto max-w-3xl">
          <SeatMap
            seats={data.seats}
            selectedSeatIds={selected.map((s) => s.id)}
            onToggleSeat={toggleSeat}
          />
        </div>
      </div>

      <div className="flex-shrink-0 bg-[#0f0f0f] border-t border-white/10 py-3 md:py-4">
        <div className="container mx-auto max-w-3xl px-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-gray-400 truncate">
              {selected.length} seat{selected.length === 1 ? "" : "s"} selected
            </p>
            <p className="text-base md:text-lg font-semibold">
              ${(totalCents / 100).toFixed(2)}
            </p>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700 cursor-pointer flex-shrink-0"
            disabled={selected.length === 0 || createBooking.isPending}
            onClick={handleBook}
          >
            {createBooking.isPending ? "Redirecting..." : "Continue to payment"}
          </Button>
        </div>
      </div>
    </main>
  );
}
