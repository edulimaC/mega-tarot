import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { paymentOrders } from "../../../../db/schema";
import {
  envValue,
  safeTrackingParameters,
  sendUtmifyOrder,
  verifyAtenasWebhookSignature,
} from "../../../../lib/payment";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() || "";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookSecret = envValue("ATENAS_WEBHOOK_SECRET");
  if (!webhookSecret) return Response.json({ error: "Webhook não configurado." }, { status: 503 });

  const validSignature = await verifyAtenasWebhookSignature(
    rawBody,
    request.headers.get("x-webhook-signature"),
  );
  if (!validSignature) return Response.json({ error: "Assinatura inválida." }, { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Payload inválido." }, { status: 400 });
  }

  const body = asRecord(payload);
  const data = asRecord(body.data || body.payment || body.transaction || payload);
  const nestedTransaction = asRecord(data.transaction);
  const event = firstString(body.event, body.type, data.event);
  if (event && event !== "payment.confirmed") return Response.json({ received: true });

  const externalId = firstString(
    body.external_id,
    data.external_id,
    nestedTransaction.external_id,
  );
  const paymentStatus = firstString(body.status, data.status, nestedTransaction.status).toLowerCase();
  const isPaid = ["paid", "confirmed", "approved", "completed", "success"].includes(paymentStatus);
  if (!externalId || !isPaid) return Response.json({ received: true });

  try {
    const db = getDb();
    const rows = await db.select().from(paymentOrders).where(eq(paymentOrders.externalId, externalId)).limit(1);
    const order = rows[0];
    // Unknown external IDs are acknowledged so a stale webhook does not get
    // retried forever, while never creating an order from untrusted input.
    if (!order) return Response.json({ received: true });

    const paidAt = order.paidAt || new Date().toISOString();
    if (order.status !== "paid") {
      await db.update(paymentOrders).set({ status: "paid", paidAt }).where(eq(paymentOrders.id, order.id)).run();
    }

    let trackingParameters = {};
    try {
      trackingParameters = safeTrackingParameters(JSON.parse(order.trackingJson));
    } catch {
      trackingParameters = {};
    }
    await sendUtmifyOrder({
      orderId: order.id,
      createdAt: order.createdAt,
      status: "paid",
      approvedAt: paidAt,
      trackingParameters,
    });

    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Não foi possível registrar a confirmação." }, { status: 503 });
  }
}
