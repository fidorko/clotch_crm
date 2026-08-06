ALTER TABLE "orders" ALTER COLUMN "payment_status_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "payment_status";--> statement-breakpoint
DROP TYPE "public"."order_payment_status";