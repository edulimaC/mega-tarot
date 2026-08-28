import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * One row per Pix checkout. The answers stay server-side so a visitor cannot
 * unlock a result by editing localStorage or changing the result URL.
 */
export const paymentOrders = sqliteTable("payment_orders", {
  id: text("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  readingId: text("reading_id").notNull(),
  answersJson: text("answers_json").notNull(),
  trackingJson: text("tracking_json").notNull().default("{}"),
  status: text("status").notNull().default("pending"),
  amountCents: integer("amount_cents").notNull().default(990),
  transactionId: text("transaction_id"),
  pixCopyPaste: text("pix_copy_paste"),
  qrCodeBase64: text("qr_code_base64"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  paidAt: text("paid_at"),
});
