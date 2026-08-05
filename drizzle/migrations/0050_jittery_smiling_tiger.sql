CREATE TABLE "delivery_methods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"carrier_key" text NOT NULL,
	"name" text NOT NULL,
	"requires_api_key" boolean DEFAULT true NOT NULL,
	"api_key" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_methods_tenant_carrier_key_key" UNIQUE("tenant_id","carrier_key")
);
--> statement-breakpoint
ALTER TABLE "delivery_methods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD CONSTRAINT "delivery_methods_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_methods_tenant_position_idx" ON "delivery_methods" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "delivery_methods" AS PERMISSIVE FOR ALL TO public USING ("delivery_methods"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("delivery_methods"."tenant_id" = current_setting('app.tenant_id', true)::uuid);