import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createBookings } from "./bookings";
import { createFakeGateway } from "./fake-gateway";

function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at a dedicated local test " +
        "database with migrations applied (see AGENTS.md)."
    );
  }
  const { hostname, pathname } = new URL(url);
  const database = pathname.replace(/^\//, "");
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isDedicated = /^(ci|test)$|[_-]test$/.test(database);
  if (!isLocal || !isDedicated) {
    throw new Error(
      `Refusing to run: TEST_DATABASE_URL must be a local database named ` +
        `"test", "ci" or ending in "_test" (got "${database}" on ${hostname}).`
    );
  }
  return url;
}

const HOLD_MS = 30 * 60 * 1000;
const title = async () => "Test Movie";

describe("Booking module", () => {
  const url = testDatabaseUrl();
  const db = new PrismaClient({ datasourceUrl: url });
  let clock: Date;
  let gateway: ReturnType<typeof createFakeGateway>;
  let bookings: ReturnType<typeof createBookings>;
  let showtimeId: string;
  let seatIds: { a1: string; a2: string; vip: string };

  beforeEach(async () => {
    await db.bookingSeat.deleteMany();
    await db.booking.deleteMany();
    await db.showtimeSeatPrice.deleteMany();
    await db.showtime.deleteMany();
    await db.seat.deleteMany();
    await db.user.deleteMany();

    await db.user.createMany({
      data: [
        { id: "u1", email: "u1@test.dev" },
        { id: "u2", email: "u2@test.dev" },
      ],
    });
    const [a1, a2, vip] = await Promise.all([
      db.seat.create({ data: { row: "A", number: 1, tier: "STANDARD" } }),
      db.seat.create({ data: { row: "A", number: 2, tier: "STANDARD" } }),
      db.seat.create({ data: { row: "B", number: 1, tier: "VIP" } }),
    ]);
    seatIds = { a1: a1.id, a2: a2.id, vip: vip.id };

    clock = new Date();
    const showtime = await db.showtime.create({
      data: {
        tmdbMovieId: 550,
        startsAt: new Date(clock.getTime() + 7 * 24 * 3600 * 1000),
        seatPrices: {
          create: [
            { tier: "STANDARD", priceCents: 1000 },
            { tier: "VIP", priceCents: 2000 },
          ],
        },
      },
    });
    showtimeId = showtime.id;

    gateway = createFakeGateway();
    bookings = createBookings({
      db,
      gateway,
      now: () => clock,
      holdDurationMs: HOLD_MS,
    });
  });

  afterAll(() => db.$disconnect());

  const start = (userId: string, seats: string[]) =>
    bookings.start({ userId, showtimeId, seatIds: seats, movieTitle: title });

  describe("start", () => {
    it("holds the seats, totals the price and returns a checkout url", async () => {
      const result = await start("u1", [seatIds.a1, seatIds.vip]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.booking.amountCents).toBe(3000);
      expect(result.value.booking.status).toBe("PENDING");
      expect(result.value.checkoutUrl).toMatch(/^https:\/\/fake-checkout/);
      expect(gateway.created[0]).toMatchObject({ title: "Test Movie", seatCount: 2 });
    });

    it("rejects a seat another customer holds", async () => {
      await start("u1", [seatIds.a1]);
      const second = await start("u2", [seatIds.a1, seatIds.a2]);

      expect(second).toMatchObject({ ok: false, reason: "SEAT_TAKEN" });
      // The losing request must not leave a partial booking behind.
      expect(await db.booking.count({ where: { userId: "u2" } })).toBe(0);
    });

    it("lets exactly one of two concurrent requests win a seat", async () => {
      const results = await Promise.all([
        start("u1", [seatIds.a1]),
        start("u2", [seatIds.a1]),
      ]);

      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(await db.bookingSeat.count({ where: { seatId: seatIds.a1 } })).toBe(1);
    });

    it("frees a seat whose hold has expired", async () => {
      const first = await start("u1", [seatIds.a1]);
      expect(first.ok).toBe(true);

      clock = new Date(clock.getTime() + HOLD_MS + 1000);
      const second = await start("u2", [seatIds.a1]);

      expect(second.ok).toBe(true);
      const stale = await db.booking.findFirstOrThrow({ where: { userId: "u1" } });
      expect(stale.status).toBe("EXPIRED");
    });

    it("releases the hold when payment setup fails", async () => {
      gateway.failNextCreate();
      const failed = await start("u1", [seatIds.a1]);

      expect(failed).toMatchObject({ ok: false, reason: "PAYMENT_SETUP_FAILED" });
      const booking = await db.booking.findFirstOrThrow({ where: { userId: "u1" } });
      expect(booking.status).toBe("FAILED");

      // The seat is immediately bookable again.
      expect((await start("u2", [seatIds.a1])).ok).toBe(true);
    });

    it("rejects unknown seats, cancelled and started showtimes", async () => {
      expect(await start("u1", ["00000000-0000-4000-8000-000000000000"])).toMatchObject({
        reason: "INVALID_SEAT",
      });

      await db.showtime.update({ where: { id: showtimeId }, data: { isCancelled: true } });
      expect(await start("u1", [seatIds.a1])).toMatchObject({
        reason: "SHOWTIME_UNAVAILABLE",
      });

      await db.showtime.update({
        where: { id: showtimeId },
        data: { isCancelled: false, startsAt: new Date(clock.getTime() - 1000) },
      });
      expect(await start("u1", [seatIds.a1])).toMatchObject({
        reason: "SHOWTIME_IN_PAST",
      });
    });

    it("rejects a seat whose tier has no price", async () => {
      await db.showtimeSeatPrice.deleteMany({ where: { tier: "VIP" } });
      expect(await start("u1", [seatIds.vip])).toMatchObject({
        reason: "MISSING_TIER_PRICE",
      });
    });
  });

  describe("markPaid", () => {
    it("marks a pending booking paid, once", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      const id = held.value.booking.id;

      expect(await bookings.markPaid(id, "pi_1")).toBe("paid");
      expect(await bookings.markPaid(id, "pi_1")).toBe("ignored");

      const booking = await db.booking.findUniqueOrThrow({ where: { id } });
      expect(booking).toMatchObject({ status: "PAID", stripePaymentIntentId: "pi_1" });
    });

    it("does not resurrect a booking whose showtime was cancelled mid-payment", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      const id = held.value.booking.id;

      await bookings.cancelShowtime(showtimeId);
      // cancelShowtime already expired the pending booking, so payment lands
      expect(await bookings.markPaid(id, "pi_late")).toBe("cancelled-needs-refund");
      expect(
        (await db.booking.findUniqueOrThrow({ where: { id } })).status
      ).toBe("EXPIRED");
    });

    it("flags a payment that lands after cancellation of a still-pending booking", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      const id = held.value.booking.id;

      // Showtime cancelled out-of-band (booking still PENDING).
      await db.showtime.update({ where: { id: showtimeId }, data: { isCancelled: true } });

      expect(await bookings.markPaid(id, "pi_late")).toBe("cancelled-needs-refund");
      const booking = await db.booking.findUniqueOrThrow({ where: { id } });
      expect(booking).toMatchObject({
        status: "CANCELLED",
        stripePaymentIntentId: "pi_late",
      });
    });
  });

  describe("late payment", () => {
    it("does not mark a released booking paid", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      const id = held.value.booking.id;
      await bookings.release(id, "FAILED");
      // Someone else takes the freed seat.
      expect((await start("u2", [seatIds.a1])).ok).toBe(true);

      expect(await bookings.markPaid(id, "pi_late")).toBe("cancelled-needs-refund");
      expect((await db.booking.findUniqueOrThrow({ where: { id } })).status).toBe(
        "FAILED"
      );
    });

    it("ignores a repeated payment notification for a paid booking", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      await bookings.markPaid(held.value.booking.id, "pi_1");
      expect(await bookings.markPaid(held.value.booking.id, "pi_1")).toBe("ignored");
    });
  });

  describe("release and cancelShowtime", () => {
    it("release frees the seats of a pending booking only", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      const id = held.value.booking.id;

      await bookings.release(id, "EXPIRED");
      expect(await db.bookingSeat.count({ where: { bookingId: id } })).toBe(0);
      expect((await start("u2", [seatIds.a1])).ok).toBe(true);
    });

    it("release leaves a paid booking alone", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      await bookings.markPaid(held.value.booking.id, "pi_1");

      await bookings.release(held.value.booking.id, "FAILED");
      const booking = await db.booking.findUniqueOrThrow({
        where: { id: held.value.booking.id },
      });
      expect(booking.status).toBe("PAID");
    });

    it("cancelShowtime expires pending holds and keeps paid bookings", async () => {
      const paid = await start("u1", [seatIds.a1]);
      const pending = await start("u2", [seatIds.a2]);
      if (!paid.ok || !pending.ok) throw new Error("setup");
      await bookings.markPaid(paid.value.booking.id, "pi_1");

      const showtime = await bookings.cancelShowtime(showtimeId);

      expect(showtime.isCancelled).toBe(true);
      const statuses = await db.booking.findMany({ select: { id: true, status: true } });
      expect(statuses.find((b) => b.id === paid.value.booking.id)?.status).toBe("PAID");
      expect(statuses.find((b) => b.id === pending.value.booking.id)?.status).toBe(
        "EXPIRED"
      );
    });
  });

  describe("pay", () => {
    async function pendingBooking() {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      return held.value;
    }

    it("reuses the open session instead of creating a second one", async () => {
      const { booking, checkoutUrl } = await pendingBooking();

      const result = await bookings.pay({
        userId: "u1",
        bookingId: booking.id,
        movieTitle: title,
      });

      expect(result).toEqual({ ok: true, value: { checkoutUrl } });
      expect(gateway.created).toHaveLength(1);
    });

    it("heals to paid when the webhook was missed and refuses a second session", async () => {
      const { booking } = await pendingBooking();
      const stored = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
      gateway.completePayment(stored.stripeCheckoutSessionId!, "pi_healed");

      const result = await bookings.pay({
        userId: "u1",
        bookingId: booking.id,
        movieTitle: title,
      });

      expect(result).toMatchObject({ ok: false, reason: "ALREADY_PAID" });
      expect(gateway.created).toHaveLength(1);
      const healed = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
      expect(healed).toMatchObject({ status: "PAID", stripePaymentIntentId: "pi_healed" });
    });

    it("creates a new session when the old one expired", async () => {
      const { booking } = await pendingBooking();
      const stored = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
      gateway.expireSession(stored.stripeCheckoutSessionId!);

      const result = await bookings.pay({
        userId: "u1",
        bookingId: booking.id,
        movieTitle: title,
      });

      expect(result.ok).toBe(true);
      expect(gateway.created).toHaveLength(2);
    });

    it("extends the hold to cover the checkout session's lifetime", async () => {
      // Stripe-like gateway: sessions live at least 30 minutes, longer than the hold.
      const shortHold = createBookings({
        db,
        gateway: createFakeGateway({ minSessionLifetimeMs: 30 * 60 * 1000 }),
        now: () => clock,
        holdDurationMs: 5 * 60 * 1000,
      });
      const held = await shortHold.start({
        userId: "u1",
        showtimeId,
        seatIds: [seatIds.a1],
        movieTitle: title,
      });
      if (!held.ok) throw new Error("setup");

      const booking = await db.booking.findUniqueOrThrow({
        where: { id: held.value.booking.id },
      });
      const sessionLifetimeMs = 30 * 60 * 1000 - 5000; // allow for test runtime
      expect(booking.expiresAt.getTime() - clock.getTime()).toBeGreaterThan(
        sessionLifetimeMs
      );
    });

    it("hides other customers' bookings and refuses expired or non-pending ones", async () => {
      const { booking } = await pendingBooking();

      expect(
        await bookings.pay({ userId: "u2", bookingId: booking.id, movieTitle: title })
      ).toMatchObject({ reason: "BOOKING_NOT_FOUND" });

      clock = new Date(clock.getTime() + HOLD_MS + 1000);
      expect(
        await bookings.pay({ userId: "u1", bookingId: booking.id, movieTitle: title })
      ).toMatchObject({ reason: "HOLD_EXPIRED" });

      await db.booking.update({ where: { id: booking.id }, data: { status: "EXPIRED" } });
      expect(
        await bookings.pay({ userId: "u1", bookingId: booking.id, movieTitle: title })
      ).toMatchObject({ reason: "NOT_PENDING", bookingStatus: "EXPIRED" });
    });
  });

  describe("reads", () => {
    it("get heals a pending booking whose payment succeeded", async () => {
      const held = await start("u1", [seatIds.a1]);
      if (!held.ok) throw new Error("setup");
      const stored = await db.booking.findUniqueOrThrow({
        where: { id: held.value.booking.id },
      });
      gateway.completePayment(stored.stripeCheckoutSessionId!);

      const booking = await bookings.get({ userId: "u1", bookingId: stored.id });
      expect(booking?.status).toBe("PAID");
      expect(await bookings.get({ userId: "u2", bookingId: stored.id })).toBeNull();
    });

    it("seatMap marks held seats taken until the hold expires", async () => {
      await start("u1", [seatIds.a1]);

      const taken = async () =>
        (await bookings.seatMap(showtimeId))!.seats.filter((s) => s.isTaken).length;
      expect(await taken()).toBe(1);

      clock = new Date(clock.getTime() + HOLD_MS + 1000);
      expect(await taken()).toBe(0);
    });

    it("listForUser shows paid and live pending bookings, not expired ones", async () => {
      const paid = await start("u1", [seatIds.a1]);
      if (!paid.ok) throw new Error("setup");
      await bookings.markPaid(paid.value.booking.id, "pi_1");
      await start("u1", [seatIds.a2]);

      const list = () => bookings.listForUser({ userId: "u1", page: 1, pageSize: 10 });
      expect((await list()).totalCount).toBe(2);

      clock = new Date(clock.getTime() + HOLD_MS + 1000);
      expect((await list()).totalCount).toBe(1);
    });
  });
});
