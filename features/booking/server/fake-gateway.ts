import type {
  CheckoutSessionRequest,
  CheckoutSessionState,
  PaymentGateway,
} from "./gateway";

export interface FakePaymentGateway extends PaymentGateway {
  readonly created: CheckoutSessionRequest[];
  failNextCreate(error?: Error): void;
  completePayment(sessionId: string, paymentIntentId?: string): void;
  expireSession(sessionId: string): void;
}

export function createFakeGateway(): FakePaymentGateway {
  const sessions = new Map<string, CheckoutSessionState>();
  const created: CheckoutSessionRequest[] = [];
  let pendingFailure: Error | null = null;
  let counter = 0;

  return {
    created,

    failNextCreate(error = new Error("FAKE_GATEWAY_DOWN")) {
      pendingFailure = error;
    },

    completePayment(sessionId, paymentIntentId = `pi_${sessionId}`) {
      sessions.set(sessionId, {
        paid: true,
        open: false,
        url: null,
        paymentIntentId,
      });
    },

    expireSession(sessionId) {
      sessions.set(sessionId, {
        paid: false,
        open: false,
        url: null,
        paymentIntentId: null,
      });
    },

    async createCheckoutSession(request) {
      if (pendingFailure) {
        const error = pendingFailure;
        pendingFailure = null;
        throw error;
      }
      created.push(request);
      const id = `cs_fake_${++counter}`;
      const url = `https://fake-checkout.test/${id}`;
      sessions.set(id, { paid: false, open: true, url, paymentIntentId: null });
      return { id, url };
    },

    async retrieveCheckoutSession(sessionId) {
      const state = sessions.get(sessionId);
      if (!state) throw new Error(`Unknown fake session ${sessionId}`);
      return state;
    },
  };
}
