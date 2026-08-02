CREATE TYPE "public"."characteristic_panel" AS ENUM('info', 'meta');--> statement-breakpoint
CREATE TABLE "product_characteristic_values" (
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"characteristic_key" text NOT NULL,
	"value_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_characteristic_values_tenant_id_product_id_characteristic_key_value_id_pk" PRIMARY KEY("tenant_id","product_id","characteristic_key","value_id")
);
--> statement-breakpoint
ALTER TABLE "product_characteristic_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_material_composition" (
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"percent" numeric(5, 2) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_material_composition_tenant_id_product_id_material_id_pk" PRIMARY KEY("tenant_id","product_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "product_material_composition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_characteristic_layout" (
	"tenant_id" uuid NOT NULL,
	"characteristic_key" text NOT NULL,
	"panel" characteristic_panel DEFAULT 'info' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_characteristic_layout_tenant_id_characteristic_key_pk" PRIMARY KEY("tenant_id","characteristic_key")
);
--> statement-breakpoint
ALTER TABLE "product_characteristic_layout" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_characteristic_values" ADD CONSTRAINT "product_characteristic_values_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_characteristic_values" ADD CONSTRAINT "product_characteristic_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_material_composition" ADD CONSTRAINT "product_material_composition_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_material_composition" ADD CONSTRAINT "product_material_composition_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_material_composition" ADD CONSTRAINT "product_material_composition_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_characteristic_layout" ADD CONSTRAINT "product_characteristic_layout_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_characteristic_values_tenant_product_idx" ON "product_characteristic_values" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "product_material_composition_tenant_product_idx" ON "product_material_composition" USING btree ("tenant_id","product_id");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "brand";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "collection";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "season_type";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "fit";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "country_of_origin";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "manufacturer";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "material";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "fabric_type";--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_characteristic_values" AS PERMISSIVE FOR ALL TO public USING ("product_characteristic_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_characteristic_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_material_composition" AS PERMISSIVE FOR ALL TO public USING ("product_material_composition"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_material_composition"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_characteristic_layout" AS PERMISSIVE FOR ALL TO public USING ("product_characteristic_layout"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_characteristic_layout"."tenant_id" = current_setting('app.tenant_id', true)::uuid);