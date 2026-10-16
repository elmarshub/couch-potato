import type Stripe from "stripe";
import type { PaymentGateway } from "./gateway";

const STRIPE_MIN_SESSION_LIFETIME_SECONDS = 30 * 60;

function resolveAppUrl(): string {
  const vercelUrl = process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;
  const vercelProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const preferProductionDomain = process.env.VERCEL_ENV === "production";

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (preferProductionDomain ? vercelProductionUrl : vercelUrl) ||
    vercelProductionUrl ||
    vercelUrl ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function createStripeGateway(stripe: Stripe): PaymentGateway {
  return {
    async createCheckoutSession(request) {
      const appUrl = resolveAppUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${request.title} — ${request.seatCount} seat${
                  request.seatCount === 1 ? "" : "s"
                }`,
                description: `Showtime: ${request.startsAt.toLocaleString("en-US", {
                  timeZone: "UTC",
                  dateStyle: "medium",
                  timeStyle: "short",
                })} UTC`,
              },
              unit_amount: request.amountCents,
            },
            quantity: 1,
          },
        ],
        metadata: { bookingId: request.bookingId },
        payment_intent_data: { metadata: { bookingId: request.bookingId } },
        success_url: `${appUrl}/theater/confirmation/${request.bookingId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/movies/${request.tmdbMovieId}/book/${request.showtimeId}/seats?cancelled=1`,
        expires_at:
          Math.floor(Date.now() / 1000) +
          Math.max(STRIPE_MIN_SESSION_LIFETIME_SECONDS, request.payableForMs / 1000),
      });

      if (!session.url) throw new Error("STRIPE_SESSION_NO_URL");
      return { id: session.id, url: session.url };
    },

    async retrieveCheckoutSession(sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        paid: session.payment_status === "paid",
        open: session.status === "open" && Boolean(session.url),
        url: session.url,
        paymentIntentId: paymentIntentIdOf(session.payment_intent),
      };
    },
  };
}

/** Stripe returns the payment intent as an id or an expanded object. */
export function paymentIntentIdOf(
  paymentIntent: string | { id: string } | null | undefined
): string | null {
  return typeof paymentIntent === "string"
    ? paymentIntent
    : (paymentIntent?.id ?? null);
}
