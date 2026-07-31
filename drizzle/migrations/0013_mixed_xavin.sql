CREATE TYPE "public"."currency_symbol_position" AS ENUM('before', 'after');--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text DEFAULT '' NOT NULL,
	"symbol_position" "currency_symbol_position" DEFAULT 'after' NOT NULL,
	"decimal_places" smallint DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"exchange_rate" numeric(14, 6),
	"rate_updated_at" timestamp with time zone,
	"auto_update" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_tenant_code_key" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "currencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "currencies" ADD CONSTRAINT "currencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "currencies_tenant_position_idx" ON "currencies" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "currencies_tenant_default_key" ON "currencies" USING btree ("tenant_id") WHERE "currencies"."is_default" = true;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "currencies" AS PERMISSIVE FOR ALL TO public USING ("currencies"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("currencies"."tenant_id" = current_setting('app.tenant_id', true)::uuid);