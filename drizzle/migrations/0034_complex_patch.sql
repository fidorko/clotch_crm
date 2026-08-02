CREATE TYPE "public"."product_activity_event" AS ENUM('created', 'updated');--> statement-breakpoint
CREATE TABLE "product_technical_layout" (
	"tenant_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_technical_layout_tenant_id_field_key_pk" PRIMARY KEY("tenant_id","field_key")
);
--> statement-breakpoint
ALTER TABLE "product_technical_layout" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_activity_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"event_type" "product_activity_event" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_name" text NOT NULL,
	"field_key" text,
	"field_label" text,
	"old_value" text,
	"new_value" text
);
--> statement-breakpoint
ALTER TABLE "product_activity_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_technical_layout" ADD CONSTRAINT "product_technical_layout_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_activity_log" ADD CONSTRAINT "product_activity_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_activity_log" ADD CONSTRAINT "product_activity_log_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_activity_log_tenant_product_idx" ON "product_activity_log" USING btree ("tenant_id","product_id","occurred_at");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_technical_layout" AS PERMISSIVE FOR ALL TO public USING ("product_technical_layout"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_technical_layout"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_activity_log" AS PERMISSIVE FOR ALL TO public USING ("product_activity_log"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_activity_log"."tenant_id" = current_setting('app.tenant_id', true)::uuid);