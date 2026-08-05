CREATE TYPE "public"."delivery_method_declared_value_mode" AS ENUM('order_amount', 'minimum_amount');--> statement-breakpoint
CREATE TYPE "public"."delivery_method_packaging" AS ENUM('none', 'carrier_packaging', 'own_packaging');--> statement-breakpoint
CREATE TYPE "public"."delivery_method_payer" AS ENUM('sender', 'recipient', 'third_party');--> statement-breakpoint
CREATE TABLE "delivery_method_status_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"delivery_method_id" uuid NOT NULL,
	"carrier_status" text NOT NULL,
	"order_status_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_method_status_rules_method_status_key" UNIQUE("tenant_id","delivery_method_id","carrier_status")
);
--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_counterparty" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_contact_person" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_phone" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_city" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_address_or_warehouse" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "allow_warehouse_delivery" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "allow_postomat_delivery" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "allow_address_delivery" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "payer" "delivery_method_payer" DEFAULT 'recipient' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "declared_value_mode" "delivery_method_declared_value_mode" DEFAULT 'order_amount' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "declared_value_minimum" numeric(12, 2) DEFAULT '500';--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sync_frequency_minutes" integer;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "auto_return_on_refusal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "packaging" "delivery_method_packaging" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "label_format" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "waybill_format" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "printer_name" text;--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ADD CONSTRAINT "delivery_method_status_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ADD CONSTRAINT "delivery_method_status_rules_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ADD CONSTRAINT "delivery_method_status_rules_order_status_id_order_statuses_id_fk" FOREIGN KEY ("order_status_id") REFERENCES "public"."order_statuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_method_status_rules_method_position_idx" ON "delivery_method_status_rules" USING btree ("tenant_id","delivery_method_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "delivery_method_status_rules" AS PERMISSIVE FOR ALL TO public USING ("delivery_method_status_rules"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("delivery_method_status_rules"."tenant_id" = current_setting('app.tenant_id', true)::uuid);