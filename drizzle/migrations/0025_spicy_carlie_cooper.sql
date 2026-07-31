CREATE TABLE "category_characteristic_excluded_values" (
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"characteristic_key" text NOT NULL,
	"value_id" uuid NOT NULL,
	CONSTRAINT "category_characteristic_excluded_values_category_id_characteristic_key_value_id_pk" PRIMARY KEY("category_id","characteristic_key","value_id")
);
--> statement-breakpoint
ALTER TABLE "category_characteristic_excluded_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "category_characteristics" (
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"characteristic_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_characteristics_tenant_id_category_id_characteristic_key_pk" PRIMARY KEY("tenant_id","category_id","characteristic_key")
);
--> statement-breakpoint
ALTER TABLE "category_characteristics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "category_characteristic_excluded_values" ADD CONSTRAINT "category_characteristic_excluded_values_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_characteristic_excluded_values" ADD CONSTRAINT "category_characteristic_excluded_values_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_characteristics" ADD CONSTRAINT "category_characteristics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_characteristics" ADD CONSTRAINT "category_characteristics_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_characteristic_excluded_values_tenant_category_idx" ON "category_characteristic_excluded_values" USING btree ("tenant_id","category_id");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "category_characteristic_excluded_values" AS PERMISSIVE FOR ALL TO public USING ("category_characteristic_excluded_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("category_characteristic_excluded_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "category_characteristics" AS PERMISSIVE FOR ALL TO public USING ("category_characteristics"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("category_characteristics"."tenant_id" = current_setting('app.tenant_id', true)::uuid);