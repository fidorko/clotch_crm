CREATE TABLE "product_color_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"color" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_color_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_color_photos" ADD CONSTRAINT "product_color_photos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_color_photos" ADD CONSTRAINT "product_color_photos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_color_photos_tenant_product_color_idx" ON "product_color_photos" USING btree ("tenant_id","product_id","color","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_color_photos" AS PERMISSIVE FOR ALL TO public USING ("product_color_photos"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_color_photos"."tenant_id" = current_setting('app.tenant_id', true)::uuid);