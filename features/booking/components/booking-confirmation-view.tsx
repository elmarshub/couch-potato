"use client";

import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useBookingQuery } from "../queries";
import type { Booking } from "../types";

const STATUS_COPY: Record<Booking["status"], { label: string; icon: React.ReactNode }> = {
  PAID: { label: "Booking confirmed", icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
  PENDING: { label: "Waiting for payment...", icon: <Clock className="w-5 h-5 text-yellow-400 animate-pulse" /> },
  EXPIRED: { label: "This hold expired", icon: <XCircle className="w-5 h-5 text-gray-400" /> },
  CANCELLED: { label: "Booking cancelled", icon: <XCircle className="w-5 h-5 text-gray-400" /> },
  FAILED: { label: "Payment failed", icon: <XCircle className="w-5 h-5 text-red-400" /> },
};

interface BookingConfirmationViewProps {
  bookingId: string;
  movieTitle: string;
  initialBooking: Booking;
}

export function BookingConfirmationView({
  bookingId,
  movieTitle,
  initialBooking,
}: BookingConfirmationViewProps) {
  const { data: booking } = useBookingQuery(bookingId, initialBooking);
  const current = booking ?? initialBooking;
  const status = STATUS_COPY[current.status];

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-1">
        {status.icon}
        <p className="text-sm uppercase tracking-wide text-gray-400">{status.label}</p>
      </div>
      <h1 className="text-2xl font-bold mb-4">{movieTitle}</h1>

      <dl className="space-y-2 text-sm">
        {current.showtime && (
          <div className="flex justify-between">
            <dt className="text-gray-400">Showtime</dt>
            <dd>{new Date(current.showtime.startsAt).toLocaleString()}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-gray-400">Seats</dt>
          <dd>
            {current.seats
              .map((bs) => (bs.seat ? `${bs.seat.row}${bs.seat.number}` : ""))
              .filter(Boolean)
              .join(", ")}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-400">Total</dt>
          <dd>${(current.amountCents / 100).toFixed(2)}</dd>
        </div>
      </dl>

      {current.status === "PENDING" && (
        <p className="text-xs text-gray-500 mt-6">
          If you completed payment on Stripe, this page will update automatically
          within a few seconds.
        </p>
      )}

      <Link
        href="/theater"
        className="inline-block mt-6 text-sm text-blue-400 hover:underline"
      >
        Back to theater
      </Link>
    </div>
  );
}
