import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function releasePendingBooking(bookingId: string, status: "EXPIRED" | "FAILED") {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== "PENDING") return;

    await tx.bookingSeat.deleteMany({ where: { bookingId } });
    await tx.booking.update({ where: { id: bookingId }, data: { status } });
  });
}

async function markBookingPaid(bookingId: string, paymentIntentId: string | null) {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== "PENDING") return;

    // Same row lock admin cancellation takes (see DELETE in
    // app/api/admin/showtimes/[id]/route.ts) so the two can't interleave.
    await tx.$queryRaw`SELECT id FROM "showtimes" WHERE id = ${booking.showtimeId} FOR UPDATE`;

    const showtime = await tx.showtime.findUnique({
      where: { id: booking.showtimeId },
    });

    if (!showtime || showtime.isCancelled) {
      // The showtime was cancelled while payment was in flight — its seat
      // hold has already been released, so don't resurrect this booking as
      // PAID. Flag it for a manual refund instead of silently dropping it.
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED", stripePaymentIntentId: paymentIntentId },
      });
      console.error(
        `Booking ${bookingId} paid after its showtime was cancelled — needs manual refund`
      );
      return;
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
    });
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        // For async payment methods (e.g. bank transfers), "completed" fires
        // once checkout is filled out but before the payment actually
        // succeeds — payment_status is still "unpaid" then. Only mark PAID
        // once Stripe confirms the payment; the async_payment_succeeded case
        // below handles the delayed-confirmation path.
        if (session.payment_status === "paid") {
          await markBookingPaid(bookingId, paymentIntentId);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        await markBookingPaid(bookingId, paymentIntentId);
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (bookingId) await releasePendingBooking(bookingId, "EXPIRED");
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.bookingId;
        if (bookingId) await releasePendingBooking(bookingId, "FAILED");
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
