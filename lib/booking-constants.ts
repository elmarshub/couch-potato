// Must stay >= Stripe Checkout's 30-minute minimum session lifetime (see
// lib/stripe-checkout.ts) so a booking's seat hold never expires — and gets
// reaped — while its Stripe session is still payable.
export const HOLD_DURATION_MS = 30 * 60 * 1000;
