CREATE TABLE "custom_characteristic_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"characteristic_id" uuid NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_characteristic_values_tenant_characteristic_value_key" UNIQUE("tenant_id","characteristic_id","value")
);
--> statement-breakpoint
ALTER TABLE "custom_characteristic_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "custom_characteristics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_characteristics_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "custom_characteristics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "custom_characteristic_values" ADD CONSTRAINT "custom_characteristic_values_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_characteristic_values" ADD CONSTRAINT "custom_characteristic_values_characteristic_id_custom_characteristics_id_fk" FOREIGN KEY ("characteristic_id") REFERENCES "public"."custom_characteristics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_characteristics" ADD CONSTRAINT "custom_characteristics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_characteristic_values_tenant_characteristic_position_idx" ON "custom_characteristic_values" USING btree ("tenant_id","characteristic_id","position");--> statement-breakpoint
CREATE INDEX "custom_characteristics_tenant_position_idx" ON "custom_characteristics" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "custom_characteristic_values" AS PERMISSIVE FOR ALL TO public USING ("custom_characteristic_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("custom_characteristic_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "custom_characteristics" AS PERMISSIVE FOR ALL TO public USING ("custom_characteristics"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("custom_characteristics"."tenant_id" = current_setting('app.tenant_id', true)::uuid);