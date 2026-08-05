CREATE TYPE "public"."delivery_method_description_content" AS ENUM('order_id', 'product_sku', 'product_names');--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "description_content" "delivery_method_description_content" DEFAULT 'product_names' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "description_include_quantity" boolean DEFAULT true NOT NULL;