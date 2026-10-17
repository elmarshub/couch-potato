
export interface CheckoutSessionRequest {
  bookingId: string;
  showtimeId: string;
  tmdbMovieId: number;
  title: string;
  seatCount: number;
  startsAt: Date;
  amountCents: number;
  payableForMs: number;
}

export interface CheckoutSession {
  id: string;
  url: string;
  /** When the provider stops accepting payment; may exceed `payableForMs`. */
  expiresAt: Date;
}

export interface CheckoutSessionState {
  paid: boolean;
  open: boolean;
  url: string | null;
  paymentIntentId: string | null;
}

export interface PaymentGateway {
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSession>;
  retrieveCheckoutSession(sessionId: string): Promise<CheckoutSessionState>;
}
