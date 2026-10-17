import { NextResponse } from "next/server";
import type { PayFailure, StartBookingFailure } from "./bookings";

type Failure<R extends string> = { reason: R; bookingStatus?: string };

const START_FAILURES: Record<StartBookingFailure, { status: number; error: string }> = {
  SEAT_TAKEN: { status: 409, error: "One or more seats are no longer available" },
  SHOWTIME_UNAVAILABLE: { status: 409, error: "Showtime unavailable" },
  SHOWTIME_IN_PAST: { status: 409, error: "Showtime has already started" },
  INVALID_SEAT: { status: 400, error: "Invalid seat selection" },
  MISSING_TIER_PRICE: {
    status: 500,
    error: "This showtime is missing a price for one of the selected seats",
  },
  PAYMENT_SETUP_FAILED: {
    status: 502,
    error: "Payment setup failed. Your seats were released; please try again.",
  },
};

export function startFailureResponse(failure: Failure<StartBookingFailure>) {
  const { status, error } = START_FAILURES[failure.reason];
  return NextResponse.json({ error }, { status });
}

export function payFailureResponse(failure: Failure<PayFailure>) {
  switch (failure.reason) {
    case "BOOKING_NOT_FOUND":
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    case "NOT_PENDING":
      return NextResponse.json(
        {
          error: `This booking is ${failure.bookingStatus?.toLowerCase()} and can't be paid for`,
        },
        { status: 409 }
      );
    case "HOLD_EXPIRED":
      return NextResponse.json(
        { error: "This booking hold has expired" },
        { status: 409 }
      );
    case "SHOWTIME_UNAVAILABLE":
      return NextResponse.json(
        { error: "This showtime has been cancelled" },
        { status: 409 }
      );
    case "SHOWTIME_IN_PAST":
      return NextResponse.json(
        { error: "This showtime has already started" },
        { status: 409 }
      );
    case "ALREADY_PAID":
      return NextResponse.json(
        { error: "This booking has already been paid for" },
        { status: 409 }
      );
  }
}
