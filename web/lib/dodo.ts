import DodoPayments from "dodopayments";

// Server-only. bearerToken/webhookKey default to DODO_PAYMENTS_API_KEY /
// DODO_PAYMENTS_WEBHOOK_KEY env vars if omitted, but set explicitly so a
// missing env var fails loudly instead of silently constructing a client
// with no auth.
export function createDodoClient() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) throw new Error("DODO_PAYMENTS_API_KEY is not set");
  return new DodoPayments({
    bearerToken,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
  });
}

export const CODEMOAT_PRO_PRODUCT_ID = process.env.DODO_PAYMENTS_PRO_PRODUCT_ID!;
