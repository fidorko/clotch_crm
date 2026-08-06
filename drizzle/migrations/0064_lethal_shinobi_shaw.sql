CREATE TYPE "public"."order_discount_type" AS ENUM('percent', 'amount');--> statement-breakpoint
CREATE TABLE "payment_statuses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_statuses_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "payment_statuses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_type" "order_discount_type";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_value" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "legal_entity_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "items_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_date" date DEFAULT CURRENT_DATE NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "expected_shipment_date" date DEFAULT CURRENT_DATE NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_type" "order_discount_type";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_value" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "promo_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "warehouse_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "use_packaging" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "weight_kg" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "package_length_cm" smallint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "package_width_cm" smallint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "package_height_cm" smallint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "seats_amount" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "declared_value" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipment_description" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cod_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payment_statuses" ADD CONSTRAINT "payment_statuses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_statuses_tenant_position_idx" ON "payment_statuses" USING btree ("tenant_id","position");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_legal_entity_id_company_legal_entities_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."company_legal_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_status_id_payment_statuses_id_fk" FOREIGN KEY ("payment_status_id") REFERENCES "public"."payment_statuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "warehouses_tenant_primary_key" ON "warehouses" USING btree ("tenant_id") WHERE "warehouses"."is_primary" = true;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "payment_statuses" AS PERMISSIVE FOR ALL TO public USING ("payment_statuses"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("payment_statuses"."tenant_id" = current_setting('app.tenant_id', true)::uuid);