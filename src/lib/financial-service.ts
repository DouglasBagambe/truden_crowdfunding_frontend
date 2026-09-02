import { apiClient } from "./api-client";

export interface PaymentIntentRequest {
  projectId: string;
  /** Integer smallest currency units. Never pass floating-point settlement amounts. */
  amountMinor: string;
  currency: string;
  idempotencyKey: string;
}

export interface PaymentIntentResponse {
  id: string;
  state:
    | "pending"
    | "authorized"
    | "captured"
    | "settled"
    | "released"
    | "refunded"
    | "failed"
    | "reversed"
    | "adjusted";
  replayed: boolean;
}

/** Creates an internal intent only. A provider redirect is never settlement confirmation. */
export async function createPaymentIntent(
  input: PaymentIntentRequest,
): Promise<PaymentIntentResponse> {
  const response = await apiClient.post<PaymentIntentResponse>(
    "/financial/payment-intents",
    {
      projectId: input.projectId,
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
    { headers: { "Idempotency-Key": input.idempotencyKey } },
  );
  return response.data;
}
