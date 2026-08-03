CREATE TYPE "public"."warehouse_type" AS ENUM('main', 'pos', 'returns', 'defective', 'disposal', 'production');--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" "warehouse_type" DEFAULT 'main' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"responsible_person" text,
	"responsible_phone" text,
	"country" text,
	"city" text,
	"address" text,
	"notes" text,
	"work_hours" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"currency_code" text,
	"can_sell" boolean DEFAULT true NOT NULL,
	"allow_negative_stock" boolean DEFAULT false NOT NULL,
	"use_bin_locations" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_tenant_code_key" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "warehouses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "warehouses_tenant_created_idx" ON "warehouses" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "warehouses" AS PERMISSIVE FOR ALL TO public USING ("warehouses"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("warehouses"."tenant_id" = current_setting('app.tenant_id', true)::uuid);