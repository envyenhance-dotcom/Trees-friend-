/**
 * bKash Merchant Payment Integration
 *
 * Credentials are stored in the app_settings table (admin configures via /admin/settings).
 * Set BKASH_BASE_URL to the sandbox URL during development:
 *   https://tokenized.sandbox.bka.sh/v1.2.0-beta
 * For production, change BKASH_BASE_URL to:
 *   https://tokenized.pay.bka.sh/v1.2.0-beta
 */

import { getSettings, SETTING_KEYS } from "./settings";
import { logger } from "./logger";

interface BkashCredentials {
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  baseUrl: string;
}

async function getCredentials(): Promise<BkashCredentials> {
  const settings = await getSettings([
    SETTING_KEYS.BKASH_APP_KEY,
    SETTING_KEYS.BKASH_APP_SECRET,
    SETTING_KEYS.BKASH_USERNAME,
    SETTING_KEYS.BKASH_PASSWORD,
    SETTING_KEYS.BKASH_BASE_URL,
  ]);

  const appKey = settings[SETTING_KEYS.BKASH_APP_KEY] || process.env.BKASH_APP_KEY;
  const appSecret = settings[SETTING_KEYS.BKASH_APP_SECRET] || process.env.BKASH_APP_SECRET;
  const username = settings[SETTING_KEYS.BKASH_USERNAME] || process.env.BKASH_USERNAME;
  const password = settings[SETTING_KEYS.BKASH_PASSWORD] || process.env.BKASH_PASSWORD;
  const baseUrl =
    settings[SETTING_KEYS.BKASH_BASE_URL] ||
    process.env.BKASH_BASE_URL ||
    "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

  if (!appKey || !appSecret || !username || !password) {
    throw new Error(
      "bKash credentials not configured. Please set them in Admin → Settings.",
    );
  }

  return { appKey, appSecret, username, password, baseUrl };
}

let tokenCache: { token: string; expiresAt: number } | null = null;

/** Step 1: Get bKash grant token */
export async function getBkashToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const creds = await getCredentials();

  const res = await fetch(`${creds.baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: creds.username,
      password: creds.password,
    },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret,
    }),
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok || data.statusCode !== "0000") {
    logger.error({ data }, "bKash token grant failed");
    throw new Error(`bKash token grant failed: ${JSON.stringify(data)}`);
  }

  const token = data.id_token as string;
  const expiresIn = (Number(data.expires_in) || 3600) * 1000;
  tokenCache = { token, expiresAt: Date.now() + expiresIn };
  return token;
}

/** Step 2: Create payment and get bKash payment URL */
export async function createPayment(amount: number, orderId: string): Promise<{
  paymentID: string;
  bkashURL: string;
  statusCode: string;
  statusMessage: string;
}> {
  const creds = await getCredentials();
  const token = await getBkashToken();

  const callbackUrl = process.env.API_CALLBACK_URL || `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:80"}/api/payments/bkash/callback`;

  const res = await fetch(`${creds.baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
      "X-APP-Key": creds.appKey,
    },
    body: JSON.stringify({
      mode: "0011", // Checkout URL mode
      payerReference: orderId,
      callbackURL: callbackUrl,
      amount: amount.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: orderId,
    }),
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok || (data.statusCode !== "0000" && data.statusCode !== "2029")) {
    logger.error({ data }, "bKash create payment failed");
    throw new Error(`bKash create payment failed: ${JSON.stringify(data)}`);
  }

  return {
    paymentID: data.paymentID as string,
    bkashURL: data.bkashURL as string,
    statusCode: data.statusCode as string,
    statusMessage: data.statusMessage as string,
  };
}

/** Step 3: Execute payment after user completes bKash flow */
export async function executePayment(paymentID: string): Promise<{
  success: boolean;
  trxID?: string;
  amount?: string;
  statusCode: string;
  statusMessage: string;
}> {
  const creds = await getCredentials();
  const token = await getBkashToken();

  const res = await fetch(`${creds.baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
      "X-APP-Key": creds.appKey,
    },
    body: JSON.stringify({ paymentID }),
  });

  const data = await res.json() as Record<string, unknown>;
  const success = data.statusCode === "0000" && data.transactionStatus === "Completed";

  return {
    success,
    trxID: data.trxID as string | undefined,
    amount: data.amount as string | undefined,
    statusCode: data.statusCode as string,
    statusMessage: data.statusMessage as string,
  };
}

/** Query an existing payment status */
export async function queryPayment(paymentID: string): Promise<Record<string, unknown>> {
  const creds = await getCredentials();
  const token = await getBkashToken();

  const res = await fetch(`${creds.baseUrl}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
      "X-APP-Key": creds.appKey,
    },
    body: JSON.stringify({ paymentID }),
  });

  return (res.json()) as Promise<Record<string, unknown>>;
}
