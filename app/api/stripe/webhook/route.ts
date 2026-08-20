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

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking && booking.status === "PENDING") {
          await prisma.booking.update({
            where: { id: bookingId },
            data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
          });
        }
        break;
      }

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
