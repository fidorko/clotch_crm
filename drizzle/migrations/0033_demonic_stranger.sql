CREATE TABLE "product_size_measurements" (
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"size" text NOT NULL,
	"measurement_value_id" uuid NOT NULL,
	"value_cm" numeric(6, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_size_measurements_tenant_id_product_id_size_measurement_value_id_pk" PRIMARY KEY("tenant_id","product_id","size","measurement_value_id")
);
--> statement-breakpoint
ALTER TABLE "product_size_measurements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_size_measurements" ADD CONSTRAINT "product_size_measurements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size_measurements" ADD CONSTRAINT "product_size_measurements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size_measurements" ADD CONSTRAINT "product_size_measurements_measurement_value_id_measurement_values_id_fk" FOREIGN KEY ("measurement_value_id") REFERENCES "public"."measurement_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_size_measurements_tenant_product_idx" ON "product_size_measurements" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_size_measurements" AS PERMISSIVE FOR ALL TO public USING ("product_size_measurements"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_size_measurements"."tenant_id" = current_setting('app.tenant_id', true)::uuid);