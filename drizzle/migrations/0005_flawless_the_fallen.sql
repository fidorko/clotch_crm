CREATE TABLE "product_sku_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sku_id" uuid NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_sku_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_sku_photos" ADD CONSTRAINT "product_sku_photos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sku_photos" ADD CONSTRAINT "product_sku_photos_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_sku_photos_tenant_sku_position_idx" ON "product_sku_photos" USING btree ("tenant_id","sku_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_sku_photos" AS PERMISSIVE FOR ALL TO public USING ("product_sku_photos"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_sku_photos"."tenant_id" = current_setting('app.tenant_id', true)::uuid);