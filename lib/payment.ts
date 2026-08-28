import { env } from "cloudflare:workers";

export const OFFER_NAME = "Desbloqueie instantaneamente o resultado de suas cartas tarot!";
export const PRICE_CENTS = 990;
export const PAYMENT_CURRENCY = "BRL";
export const ATENAS_API_BASE = "https://nexuspag.com";

export const READING_IDS = new Set([
  "feelings",
  "return",
  "third",
  "next",
  "love",
  "decision",
  "near",
  "block",
  "message",
]);

export type TrackingParameters = Record<string, string>;

type RuntimeEnv = Record<string, string | undefined>;

function runtimeEnv() {
  return env as unknown as RuntimeEnv;
}

export function envValue(key: string) {
  return runtimeEnv()[key]?.trim() || "";
}

export function moneyFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

export function safeTrackingParameters(value: unknown): TrackingParameters {
  if (!value || typeof value !== "object") return {};

  const allowed = new Set([
    "src",
    "sck",
    "utm_source",
    "utm_campaign",
    "utm_medium",
    "utm_content",
    "utm_term",
  ]);
  const result: TrackingParameters = {};

  for (const [key, rawValue] of Object.entries(value)) {
    if (!allowed.has(key) || typeof rawValue !== "string") continue;
    const cleaned = rawValue.trim().slice(0, 160);
    if (cleaned) result[key] = cleaned;
  }

  return result;
}

export function technicalCustomerEmail(orderId: string) {
  // O e-mail não é solicitado do cliente. A Utmify exige uma string de
  // e-mail no schema, então usamos um identificador técnico por pedido que
  // nunca é usado para contato.
  return `pedido-${orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}@tracking.megatarot.local`;
}

function formatUtmifyDate(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return [
    `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`,
    `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`,
  ].join(" ");
}

export type UtmifyOrderInput = {
  orderId: string;
  createdAt: string | Date;
  status: "waiting_payment" | "paid";
  trackingParameters?: TrackingParameters;
  customerName?: string;
  approvedAt?: string | Date | null;
};

/**
 * Sends a complete order payload to Utmify. Tracking is intentionally
 * best-effort: a tracking outage must never block a Pix checkout or unlock.
 */
export async function sendUtmifyOrder(input: UtmifyOrderInput) {
  const token = envValue("UTMIFY_API_TOKEN");
  if (!token) return false;

  const createdAt = input.createdAt instanceof Date ? input.createdAt : new Date(input.createdAt);
  const approvedAt = input.approvedAt
    ? input.approvedAt instanceof Date
      ? input.approvedAt
      : new Date(input.approvedAt)
    : null;
  const customerName = input.customerName?.trim().slice(0, 120) || "Cliente MegaTarot";

  const payload = {
    orderId: input.orderId,
    platform: "MegaTarot",
    paymentMethod: "pix",
    status: input.status,
    createdAt: formatUtmifyDate(createdAt),
    approvedDate: approvedAt ? formatUtmifyDate(approvedAt) : null,
    refundedAt: null,
    customer: {
      name: customerName,
      email: technicalCustomerEmail(input.orderId),
      phone: null,
      document: null,
      country: "BR",
    },
    products: [
      {
        id: "mega-tarot-reading",
        name: OFFER_NAME,
        planId: null,
        planName: null,
        planType: "payment",
        quantity: 1,
        priceInCents: PRICE_CENTS,
      },
    ],
    trackingParameters: input.trackingParameters || {},
    commission: {
      totalPriceInCents: PRICE_CENTS,
      gatewayFeeInCents: 0,
      userCommissionInCents: PRICE_CENTS,
    },
    isTest: false,
  };

  try {
    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

type AtenasTransaction = {
  id?: string;
  transaction_id?: string;
  pix_copia_cola?: string;
  pixCopyPaste?: string;
  qr_code_base64?: string;
  qrCodeBase64?: string;
  expires_at?: string;
  expiresAt?: string;
};

export type CreatedPix = {
  transactionId: string;
  pixCopyPaste: string;
  qrCodeBase64: string;
  expiresAt: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() || "";
}

export async function createAtenasPix({ orderId, origin }: { orderId: string; origin: string }) {
  const apiKey = envValue("ATENAS_API_KEY");
  if (!apiKey) throw new Error("PAYMENT_NOT_CONFIGURED");

  const response = await fetch(`${ATENAS_API_BASE}/api/pix/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      amount: PRICE_CENTS / 100,
      description: OFFER_NAME,
      external_id: orderId,
      webhook_url: `${origin}/api/webhooks/atenaspay`,
      expiration: 1800,
    }),
  });

  const raw = await response.json().catch(() => null);
  if (!response.ok) throw new Error("ATENAS_CREATE_FAILED");

  const body = asRecord(raw);
  const transaction = asRecord(body.transaction || body.data || raw) as AtenasTransaction;
  const transactionId = firstString(
    transaction.id,
    transaction.transaction_id,
    body.transaction_id,
    body.id,
  );
  const pixCopyPaste = firstString(
    transaction.pix_copia_cola,
    transaction.pixCopyPaste,
    body.pix_copia_cola,
    body.pixCopyPaste,
  );
  const qrCodeBase64 = firstString(
    transaction.qr_code_base64,
    transaction.qrCodeBase64,
    body.qr_code_base64,
    body.qrCodeBase64,
  );
  const expiresAt = firstString(transaction.expires_at, transaction.expiresAt, body.expires_at, body.expiresAt);

  if (!transactionId || !pixCopyPaste || !qrCodeBase64) throw new Error("ATENAS_INVALID_RESPONSE");

  return { transactionId, pixCopyPaste, qrCodeBase64, expiresAt } satisfies CreatedPix;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyAtenasWebhookSignature(rawBody: string, header: string | null) {
  const secret = envValue("ATENAS_WEBHOOK_SECRET");
  if (!secret || !header) return false;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, ...rest] = part.trim().split("=");
    const value = rest.join("=").trim();
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }

  const numericTimestamp = Number(timestamp);
  if (!Number.isFinite(numericTimestamp) || Math.abs(Date.now() / 1000 - numericTimestamp) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`)),
  );
  const expected = bytesToHex(digest);
  return signatures.some((signature) => constantTimeEqual(signature.toLowerCase(), expected));
}
