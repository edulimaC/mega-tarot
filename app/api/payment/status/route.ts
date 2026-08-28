import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { paymentOrders } from "../../../../db/schema";
import { OFFER_NAME } from "../../../../lib/payment";

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId")?.trim() || "";
  if (!orderId || orderId.length > 80) return response({ error: "Pedido inválido." }, 400);

  try {
    const db = getDb();
    const rows = await db.select().from(paymentOrders).where(eq(paymentOrders.id, orderId)).limit(1);
    const order = rows[0];
    if (!order) return response({ error: "Pedido não encontrado." }, 404);

    let status = order.status;
    const expired = status === "pending" && order.expiresAt && Number.isFinite(Date.parse(order.expiresAt)) && Date.parse(order.expiresAt) <= Date.now();
    if (expired) {
      status = "expired";
      await db.update(paymentOrders).set({ status }).where(eq(paymentOrders.id, order.id)).run().catch(() => undefined);
    }

    const isPaid = status === "paid";
    const answers = isPaid
      ? (() => {
          try {
            const parsed = JSON.parse(order.answersJson);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : undefined;

    return response({
      orderId: order.id,
      readingId: order.readingId,
      offerName: OFFER_NAME,
      amount: order.amountCents / 100,
      status,
      paid: isPaid,
      expiresAt: order.expiresAt,
      pixCopyPaste: status === "pending" ? order.pixCopyPaste : null,
      qrCodeBase64: status === "pending" ? order.qrCodeBase64 : null,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      ...(answers ? { answers } : {}),
    });
  } catch {
    return response({ error: "Não foi possível consultar este pedido agora." }, 503);
  }
}
