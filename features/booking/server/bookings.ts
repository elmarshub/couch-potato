import { Prisma } from "@prisma/client";
import type { Booking, PrismaClient } from "@prisma/client";
import type { PaymentGateway } from "./gateway";


export const HOLD_DURATION_MS = 30 * 60 * 1000;

export type Result<T, R extends string> =
  | { ok: true; value: T }
  | { ok: false; reason: R; bookingStatus?: Booking["status"] };

const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
const fail = <R extends string>(
  reason: R,
  bookingStatus?: Booking["status"]
): { ok: false; reason: R; bookingStatus?: Booking["status"] } => ({
  ok: false,
  reason,
  bookingStatus,
});

export type StartBookingFailure =
  | "SHOWTIME_UNAVAILABLE"
  | "SHOWTIME_IN_PAST"
  | "INVALID_SEAT"
  | "MISSING_TIER_PRICE"
  | "SEAT_TAKEN"
  | "PAYMENT_SETUP_FAILED";

export type PayFailure =
  | "BOOKING_NOT_FOUND"
  | "NOT_PENDING"
  | "HOLD_EXPIRED"
  | "SHOWTIME_UNAVAILABLE"
  | "SHOWTIME_IN_PAST"
  | "ALREADY_PAID";

export type MarkPaidOutcome = "paid" | "cancelled-needs-refund" | "ignored";

export interface BookingsDeps {
  db: PrismaClient;
  gateway: PaymentGateway;
  now?: () => Date;
  holdDurationMs?: number;
}

type Tx = Prisma.TransactionClient;

export function liveBookingWhere(now: Date): Prisma.BookingWhereInput {
  return {
    OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: now } }],
  };
}

export function createBookings({
  db,
  gateway,
  now = () => new Date(),
  holdDurationMs = HOLD_DURATION_MS,
}: BookingsDeps) {

  async function lockShowtime(tx: Tx, showtimeId: string) {
    await tx.$queryRaw`SELECT id FROM "showtimes" WHERE id = ${showtimeId} FOR UPDATE`;
  }

  async function releaseSeats(tx: Tx, bookingIds: string[]) {
    await tx.bookingSeat.deleteMany({ where: { bookingId: { in: bookingIds } } });
  }

  async function markPaid(
    bookingId: string,
    paymentIntentId: string | null
  ): Promise<MarkPaidOutcome> {
    return db.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.status !== "PENDING") return "ignored";

      await lockShowtime(tx, booking.showtimeId);
      const showtime = await tx.showtime.findUnique({
        where: { id: booking.showtimeId },
      });

      if (!showtime || showtime.isCancelled) {
      
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CANCELLED", stripePaymentIntentId: paymentIntentId },
        });
        console.error(
          `Booking ${bookingId} paid after its showtime was cancelled — needs manual refund`
        );
        return "cancelled-needs-refund";
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
      });
      return "paid";
    });
  }

  async function release(bookingId: string, status: "EXPIRED" | "FAILED") {
    await db.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.status !== "PENDING") return;

      await releaseSeats(tx, [bookingId]);
      await tx.booking.update({ where: { id: bookingId }, data: { status } });
    });
  }

  async function cancelShowtime(showtimeId: string) {
    return db.$transaction(async (tx) => {
      await lockShowtime(tx, showtimeId);

      await tx.bookingSeat.deleteMany({
        where: { showtimeId, booking: { status: "PENDING" } },
      });
      await tx.booking.updateMany({
        where: { showtimeId, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
      return tx.showtime.update({
        where: { id: showtimeId },
        data: { isCancelled: true },
      });
    });
  }

  /** Opens a checkout session for a Pending Booking and records it. */
  async function openCheckout(
    booking: Booking & { seats: unknown[] },
    showtime: { id: string; tmdbMovieId: number; startsAt: Date },
    movieTitle: (tmdbMovieId: number) => Promise<string>
  ): Promise<string> {
    const session = await gateway.createCheckoutSession({
      bookingId: booking.id,
      showtimeId: showtime.id,
      tmdbMovieId: showtime.tmdbMovieId,
      title: await movieTitle(showtime.tmdbMovieId),
      seatCount: booking.seats.length,
      startsAt: showtime.startsAt,
      amountCents: booking.amountCents,
      payableForMs: holdDurationMs,
    });
    await db.booking.update({
      where: { id: booking.id },
      data: { stripeCheckoutSessionId: session.id },
    });
    return session.url;
  }

  type Reconciliation =
    | { outcome: "already-paid" }
    | { outcome: "reuse-existing-session"; checkoutUrl: string }
    | { outcome: "needs-new-session" };


  async function reconcile(booking: Booking): Promise<Reconciliation> {
    if (!booking.stripeCheckoutSessionId) return { outcome: "needs-new-session" };

    const session = await gateway.retrieveCheckoutSession(
      booking.stripeCheckoutSessionId
    );

    if (session.paid) {
      if (booking.status === "PENDING") {
        await markPaid(booking.id, session.paymentIntentId);
      }
      return { outcome: "already-paid" };
    }
    if (session.open && session.url) {
      return { outcome: "reuse-existing-session", checkoutUrl: session.url };
    }
    return { outcome: "needs-new-session" };
  }

  async function start(input: {
    userId: string;
    showtimeId: string;
    seatIds: string[];
    movieTitle: (tmdbMovieId: number) => Promise<string>;
  }) {
    const { userId, showtimeId, movieTitle } = input;
    const seatIds = Array.from(new Set(input.seatIds));

    type Held = Result<
      {
        booking: Booking & { seats: { id: string }[] };
        showtime: { id: string; tmdbMovieId: number; startsAt: Date };
      },
      StartBookingFailure
    >;

    let held: Held;
    try {
      held = await db.$transaction(async (tx): Promise<Held> => {
        const showtime = await tx.showtime.findUnique({
          where: { id: showtimeId },
          include: { seatPrices: true },
        });
        if (!showtime || showtime.isCancelled) return fail("SHOWTIME_UNAVAILABLE");
        if (showtime.startsAt <= now()) return fail("SHOWTIME_IN_PAST");

        const seats = await tx.seat.findMany({ where: { id: { in: seatIds } } });
        if (seats.length !== seatIds.length) return fail("INVALID_SEAT");

     
        const stale = await tx.bookingSeat.findMany({
          where: {
            showtimeId,
            seatId: { in: seatIds },
            booking: { status: "PENDING", expiresAt: { lte: now() } },
          },
          select: { id: true, bookingId: true },
        });
        if (stale.length > 0) {
          await tx.bookingSeat.deleteMany({
            where: { id: { in: stale.map((bs) => bs.id) } },
          });
          await tx.booking.updateMany({
            where: { id: { in: stale.map((bs) => bs.bookingId) }, status: "PENDING" },
            data: { status: "EXPIRED" },
          });
        }

        const priceByTier = new Map(
          showtime.seatPrices.map((p) => [p.tier, p.priceCents])
        );
        const selections: { seatId: string; priceCents: number }[] = [];
        for (const seat of seats) {
          const priceCents = priceByTier.get(seat.tier);
          if (priceCents === undefined) return fail("MISSING_TIER_PRICE");
          selections.push({ seatId: seat.id, priceCents });
        }
        const amountCents = selections.reduce((sum, s) => sum + s.priceCents, 0);

      
        const booking = await tx.booking.create({
          data: {
            userId,
            showtimeId,
            amountCents,
            expiresAt: new Date(now().getTime() + holdDurationMs),
            seats: {
              create: selections.map(({ seatId, priceCents }) => ({
                seatId,
                showtimeId,
                priceCents,
              })),
            },
          },
          include: { seats: true },
        });
        return ok({ booking, showtime });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return fail("SEAT_TAKEN");
      }
      throw error;
    }

    if (!held.ok) return held;
    const { booking, showtime } = held.value;

    try {
      const checkoutUrl = await openCheckout(booking, showtime, movieTitle);
      return ok({ booking, checkoutUrl });
    } catch (error) {
      // Don't leave the Seats held for the full window over a failed setup.
      console.error("Payment setup failed; releasing hold:", error);
      await release(booking.id, "FAILED");
      return fail("PAYMENT_SETUP_FAILED");
    }
  }

  async function pay(input: {
    userId: string;
    bookingId: string;
    movieTitle: (tmdbMovieId: number) => Promise<string>;
  }): Promise<Result<{ checkoutUrl: string }, PayFailure>> {
    const booking = await db.booking.findUnique({
      where: { id: input.bookingId },
      include: { seats: true, showtime: true },
    });

    if (!booking || booking.userId !== input.userId) {
      return fail("BOOKING_NOT_FOUND");
    }
    if (booking.status !== "PENDING") return fail("NOT_PENDING", booking.status);
    if (booking.expiresAt <= now()) return fail("HOLD_EXPIRED");
    if (booking.showtime.isCancelled) return fail("SHOWTIME_UNAVAILABLE");
    if (booking.showtime.startsAt <= now()) return fail("SHOWTIME_IN_PAST");

    const reconciliation = await reconcile(booking);
    if (reconciliation.outcome === "already-paid") return fail("ALREADY_PAID");
    if (reconciliation.outcome === "reuse-existing-session") {
      return ok({ checkoutUrl: reconciliation.checkoutUrl });
    }

    const checkoutUrl = await openCheckout(booking, booking.showtime, input.movieTitle);
    return ok({ checkoutUrl });
  }

  /** A customer's Booking, healed against the payment provider if still Pending. */
  async function get(input: { userId: string; bookingId: string }) {
    const include = { seats: { include: { seat: true } }, showtime: true } as const;
    let booking = await db.booking.findUnique({
      where: { id: input.bookingId },
      include,
    });
    if (!booking || booking.userId !== input.userId) return null;

    if (booking.status === "PENDING" && booking.stripeCheckoutSessionId) {
      const reconciliation = await reconcile(booking).catch(() => null);
      if (reconciliation?.outcome === "already-paid") {
        booking = await db.booking.findUnique({
          where: { id: input.bookingId },
          include,
        });
      }
    }
    return booking;
  }

  async function listForUser(input: {
    userId: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.BookingWhereInput = {
      userId: input.userId,
      ...liveBookingWhere(now()),
    };
    const [totalCount, bookings] = await Promise.all([
      db.booking.count({ where }),
      db.booking.findMany({
        where,
        include: { showtime: true, seats: { include: { seat: true } } },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);
    return { totalCount, bookings };
  }

  async function seatMap(showtimeId: string) {
    const showtime = await db.showtime.findUnique({
      where: { id: showtimeId },
      include: { seatPrices: true },
    });
    if (!showtime) return null;

    const [allSeats, takenBookingSeats] = await Promise.all([
      db.seat.findMany({ orderBy: [{ row: "asc" }, { number: "asc" }] }),
      db.bookingSeat.findMany({
        where: { showtimeId, booking: liveBookingWhere(now()) },
        select: { seatId: true },
      }),
    ]);

    const taken = new Set(takenBookingSeats.map((bs) => bs.seatId));
    const pricedTiers = new Set(showtime.seatPrices.map((p) => p.tier));

    return {
      showtime,
      seats: allSeats.map((seat) => ({
        id: seat.id,
        row: seat.row,
        number: seat.number,
        tier: seat.tier,
        isTaken: taken.has(seat.id),
        // A tier the Showtime doesn't price must never be selectable.
        hasPrice: pricedTiers.has(seat.tier),
      })),
    };
  }

  return { start, pay, get, markPaid, release, cancelShowtime, listForUser, seatMap };
}

export type Bookings = ReturnType<typeof createBookings>;
