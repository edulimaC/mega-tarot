CREATE TABLE `payment_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`external_id` text NOT NULL,
	`reading_id` text NOT NULL,
	`answers_json` text NOT NULL,
	`tracking_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount_cents` integer DEFAULT 990 NOT NULL,
	`transaction_id` text,
	`pix_copy_paste` text,
	`qr_code_base64` text,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_orders_external_id_unique` ON `payment_orders` (`external_id`);