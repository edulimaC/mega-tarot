import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { paymentOrders } from "../../../../db/schema";
import {
  OFFER_NAME,
  PRICE_CENTS,
  READING_IDS,
  createAtenasPix,
  envValue,
  safeTrackingParameters,
  sendUtmifyOrder,
} from "../../../../lib/payment";

const ANSWER_COUNT = 12;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Não foi possível ler suas respostas. Tente novamente.", 400);
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const readingId = typeof body.readingId === "string" ? body.readingId : "";
  const answers = Array.isArray(body.answers)
    ? body.answers.filter((answer): answer is string => typeof answer === "string").map((answer) => answer.trim().slice(0, 240))
    : [];

  if (!READING_IDS.has(readingId) || answers.length !== ANSWER_COUNT || answers.some((answer) => !answer)) {
    return jsonError("Complete as 12 respostas para abrir sua mesa.", 400);
  }

  const orderId = crypto.randomUUID();
  const createdAt = new Date();
  const defaultExpiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString();
  const trackingParameters = safeTrackingParameters(body.trackingParameters);
  const db = getDb();

  try {
    await db.insert(paymentOrders).values({
      id: orderId,
      externalId: orderId,
      readingId,
      answersJson: JSON.stringify(answers),
      trackingJson: JSON.stringify(trackingParameters),
      status: "pending",
      amountCents: PRICE_CENTS,
      expiresAt: defaultExpiresAt,
      createdAt: createdAt.toISOString(),
    }).run();
  } catch {
    return jsonError("A mesa está recebendo muitas consultas. Tente novamente em alguns instantes.", 503);
  }

  try {
    const configuredOrigin = envValue("PUBLIC_SITE_URL").replace(/\/$/, "");
    const origin = configuredOrigin || new URL(request.url).origin;
    const pix = await createAtenasPix({ orderId, origin });
    const expiresAt = pix.expiresAt || defaultExpiresAt;

    await db.update(paymentOrders).set({
      transactionId: pix.transactionId,
      pixCopyPaste: pix.pixCopyPaste,
      qrCodeBase64: pix.qrCodeBase64,
      expiresAt,
    }).where(eq(paymentOrders.id, orderId)).run();

    await sendUtmifyOrder({
      orderId,
      createdAt,
      status: "waiting_payment",
      trackingParameters,
    });

    return Response.json({
      orderId,
      readingId,
      offerName: OFFER_NAME,
      amount: PRICE_CENTS / 100,
      pixCopyPaste: pix.pixCopyPaste,
      qrCodeBase64: pix.qrCodeBase64,
      expiresAt,
    }, { status: 201 });
  } catch (error) {
    await db.update(paymentOrders).set({ status: "failed" }).where(eq(paymentOrders.id, orderId)).run().catch(() => undefined);
    if (error instanceof Error && error.message === "PAYMENT_NOT_CONFIGURED") {
      return jsonError("O pagamento ainda não foi configurado. Adicione as credenciais renovadas da AtenasPay no ambiente do site.", 503);
    }
    return jsonError("Não foi possível gerar o Pix agora. Tente novamente em instantes.", 502);
  }
}
