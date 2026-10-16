import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { bookings } from "@/features/booking/server";
import { paymentIntentIdOf } from "@/features/booking/server/stripe-gateway";

export const runtime = "nodejs";

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

        const paymentIntentId = paymentIntentIdOf(session.payment_intent);

        // For async payment methods (e.g. bank transfers), "completed" fires
        // once checkout is filled out but before the payment actually
        // succeeds — payment_status is still "unpaid" then. Only mark PAID
        // once Stripe confirms the payment; the async_payment_succeeded case
        // below handles the delayed-confirmation path.
        if (session.payment_status === "paid") {
          await bookings.markPaid(bookingId, paymentIntentId);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const paymentIntentId = paymentIntentIdOf(session.payment_intent);

        await bookings.markPaid(bookingId, paymentIntentId);
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (bookingId) await bookings.release(bookingId, "EXPIRED");
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.bookingId;
        if (bookingId) await bookings.release(bookingId, "FAILED");
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
