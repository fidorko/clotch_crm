CREATE TYPE "public"."payment_method_kind" AS ENUM('bank_transfer', 'card_online', 'partial_payment', 'cash_on_delivery', 'custom');--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kind" "payment_method_kind" DEFAULT 'custom' NOT NULL,
	"name" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"partial_amount" numeric(12, 2),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_methods_tenant_position_idx" ON "payment_methods" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "payment_methods" AS PERMISSIVE FOR ALL TO public USING ("payment_methods"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("payment_methods"."tenant_id" = current_setting('app.tenant_id', true)::uuid);