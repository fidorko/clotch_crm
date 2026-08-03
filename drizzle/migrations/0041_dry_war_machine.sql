CREATE TYPE "public"."warehouse_bin_separator" AS ENUM('space', 'dash', 'slash', 'none');--> statement-breakpoint
CREATE TABLE "warehouse_bin_locations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"code" text NOT NULL,
	"level1_value" text NOT NULL,
	"level2_value" text NOT NULL,
	"level3_value" text NOT NULL,
	"barcode" text,
	"qr_payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_bin_locations_tenant_warehouse_code_key" UNIQUE("tenant_id","warehouse_id","code")
);
--> statement-breakpoint
ALTER TABLE "warehouse_bin_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_level1_name" text DEFAULT 'Вулиця' NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_level2_name" text DEFAULT 'Стелаж' NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_level3_name" text DEFAULT 'Комірка' NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_level1_format" text DEFAULT '101' NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_level2_format" text DEFAULT 'A' NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_level3_format" text DEFAULT '01' NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_separator" "warehouse_bin_separator" DEFAULT 'space' NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_generate_barcodes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_generate_qr" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_allow_label_reprint" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_streets_count" integer;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_racks_per_street" integer;--> statement-breakpoint
ALTER TABLE "warehouses" ADD COLUMN "bin_cells_per_rack" integer;--> statement-breakpoint
ALTER TABLE "warehouse_bin_locations" ADD CONSTRAINT "warehouse_bin_locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_locations" ADD CONSTRAINT "warehouse_bin_locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "warehouse_bin_locations_tenant_warehouse_idx" ON "warehouse_bin_locations" USING btree ("tenant_id","warehouse_id");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "warehouse_bin_locations" AS PERMISSIVE FOR ALL TO public USING ("warehouse_bin_locations"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("warehouse_bin_locations"."tenant_id" = current_setting('app.tenant_id', true)::uuid);