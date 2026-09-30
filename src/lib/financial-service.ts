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

export type PayoutDestinationType = "bank" | "mobile_money";
export type PayoutState = "pending" | "processing" | "paid" | "failed";
export type ReceiptState =
  "AUTHORIZED" | "PENDING" | "SUBMITTED" | "ISSUED" | "FAILED" | "REVOKED";

export interface PayoutDestination {
  id: string;
  type?: PayoutDestinationType;
  destination_type?: PayoutDestinationType;
  currency: string;
  maskedDisplay?: string;
  masked_display?: string;
  status: "verified" | "disabled";
}

export interface Payout {
  id: string;
  releaseId?: string;
  release_id?: string;
  amountMinor?: string;
  amount_minor?: string;
  currency: string;
  state: PayoutState;
  keiboReference?: string;
  keibo_reference?: string;
  maskedDisplay?: string;
  masked_display?: string;
  createdAt?: string;
  created_at?: string;
  provider?: string;
}

export interface Receipt {
  id: string;
  state: ReceiptState;
  txHash?: string | null;
  tx_hash?: string | null;
  investorWallet?: string;
  investor_wallet?: string;
  campaignId?: string;
  campaign_id?: string;
  amountMinor?: string;
  amount_minor?: string;
  issuedAt?: string;
  issued_at?: string;
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

export async function createPayoutDestination(input: {
  type: PayoutDestinationType;
  accountNumber: string;
  bankOrNetwork: string;
  accountName?: string;
  idempotencyKey: string;
}): Promise<PayoutDestination> {
  const response = await apiClient.post<PayoutDestination>(
    "/financial/payout-destinations",
    {
      type: input.type,
      accountNumber: input.accountNumber,
      bankOrNetwork: input.bankOrNetwork,
      accountName: input.accountName || undefined,
    },
    { headers: { "Idempotency-Key": input.idempotencyKey } },
  );
  return response.data;
}

export async function getPayoutDestinations(): Promise<PayoutDestination[]> {
  const response = await apiClient.get<PayoutDestination[]>(
    "/financial/payout-destinations",
  );
  return response.data;
}

export async function disablePayoutDestination(
  id: string,
): Promise<PayoutDestination> {
  const response = await apiClient.post<PayoutDestination>(
    `/financial/payout-destinations/${id}/disable`,
  );
  return response.data;
}

export async function requestPayout(
  releaseId: string,
  destinationId: string,
  idempotencyKey: string,
): Promise<Payout> {
  const response = await apiClient.post<Payout>(
    `/financial/releases/${releaseId}/payout`,
    { destinationId },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return response.data;
}

export async function getPayouts(): Promise<Payout[]> {
  const response = await apiClient.get<Payout[]>("/financial/payouts");
  return response.data;
}

export async function getPayout(id: string): Promise<Payout> {
  const response = await apiClient.get<Payout>(`/financial/payouts/${id}`);
  return response.data;
}

export async function authorizeReceipt(settlementId: string) {
  const response = await apiClient.post(
    `/financial/receipts/${settlementId}/authorize`,
  );
  return response.data;
}

export async function issueReceipt(settlementId: string): Promise<Receipt> {
  const response = await apiClient.post<Receipt>(
    `/financial/receipts/${settlementId}/issue`,
  );
  return response.data;
}

export async function getReceipt(settlementId: string): Promise<Receipt> {
  const response = await apiClient.get<Receipt>(
    `/financial/receipts/${settlementId}`,
  );
  return response.data;
}

/** Records chain evidence only; the backend verifies and settles the contribution. */
export async function submitOnchainContribution(input: {
  paymentIntentId: string;
  projectOnchainId: string;
  investorWallet: string;
  transactionHash: string;
}) {
  const response = await apiClient.post(
    "/financial/onchain-contributions",
    input,
  );
  return response.data;
}
