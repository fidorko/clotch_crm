CREATE TYPE "public"."reference_item_kind" AS ENUM('collections', 'seasons', 'fabric-materials', 'manufacturers', 'brands', 'countries', 'currencies', 'units', 'fit');--> statement-breakpoint
CREATE TABLE "reference_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kind" "reference_item_kind" NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reference_items_tenant_kind_name_key" UNIQUE("tenant_id","kind","name")
);
--> statement-breakpoint
ALTER TABLE "reference_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reference_items" ADD CONSTRAINT "reference_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reference_items_tenant_kind_position_idx" ON "reference_items" USING btree ("tenant_id","kind","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "reference_items" AS PERMISSIVE FOR ALL TO public USING ("reference_items"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("reference_items"."tenant_id" = current_setting('app.tenant_id', true)::uuid);