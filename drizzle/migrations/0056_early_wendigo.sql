CREATE TYPE "public"."delivery_method_marking_printer_type" AS ENUM('thermal', 'regular');--> statement-breakpoint
CREATE TYPE "public"."delivery_method_sender_address_type" AS ENUM('warehouse', 'address');--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_address_type" "delivery_method_sender_address_type" DEFAULT 'warehouse' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_street_ref" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_street" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_house_number" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "use_carrier_packaging" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "marking_printer_type" "delivery_method_marking_printer_type" DEFAULT 'regular' NOT NULL;