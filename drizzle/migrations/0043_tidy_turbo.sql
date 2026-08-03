CREATE TABLE "warehouse_bin_cells" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"rack_id" uuid NOT NULL,
	"value" text NOT NULL,
	"code" text NOT NULL,
	"barcode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_bin_cells_tenant_rack_value_key" UNIQUE("tenant_id","rack_id","value"),
	CONSTRAINT "warehouse_bin_cells_tenant_warehouse_code_key" UNIQUE("tenant_id","warehouse_id","code")
);
--> statement-breakpoint
ALTER TABLE "warehouse_bin_cells" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "warehouse_bin_racks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"street_id" uuid NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_bin_racks_tenant_street_value_key" UNIQUE("tenant_id","street_id","value")
);
--> statement-breakpoint
ALTER TABLE "warehouse_bin_racks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "warehouse_bin_streets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_bin_streets_tenant_warehouse_value_key" UNIQUE("tenant_id","warehouse_id","value")
);
--> statement-breakpoint
ALTER TABLE "warehouse_bin_streets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "warehouse_bin_cells" ADD CONSTRAINT "warehouse_bin_cells_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_cells" ADD CONSTRAINT "warehouse_bin_cells_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_cells" ADD CONSTRAINT "warehouse_bin_cells_rack_id_warehouse_bin_racks_id_fk" FOREIGN KEY ("rack_id") REFERENCES "public"."warehouse_bin_racks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_racks" ADD CONSTRAINT "warehouse_bin_racks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_racks" ADD CONSTRAINT "warehouse_bin_racks_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_racks" ADD CONSTRAINT "warehouse_bin_racks_street_id_warehouse_bin_streets_id_fk" FOREIGN KEY ("street_id") REFERENCES "public"."warehouse_bin_streets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_streets" ADD CONSTRAINT "warehouse_bin_streets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bin_streets" ADD CONSTRAINT "warehouse_bin_streets_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "warehouse_bin_cells_tenant_rack_idx" ON "warehouse_bin_cells" USING btree ("tenant_id","rack_id");--> statement-breakpoint
CREATE INDEX "warehouse_bin_cells_tenant_warehouse_idx" ON "warehouse_bin_cells" USING btree ("tenant_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "warehouse_bin_racks_tenant_street_idx" ON "warehouse_bin_racks" USING btree ("tenant_id","street_id");--> statement-breakpoint
CREATE INDEX "warehouse_bin_streets_tenant_warehouse_idx" ON "warehouse_bin_streets" USING btree ("tenant_id","warehouse_id");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "warehouse_bin_cells" AS PERMISSIVE FOR ALL TO public USING ("warehouse_bin_cells"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("warehouse_bin_cells"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "warehouse_bin_racks" AS PERMISSIVE FOR ALL TO public USING ("warehouse_bin_racks"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("warehouse_bin_racks"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "warehouse_bin_streets" AS PERMISSIVE FOR ALL TO public USING ("warehouse_bin_streets"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("warehouse_bin_streets"."tenant_id" = current_setting('app.tenant_id', true)::uuid);