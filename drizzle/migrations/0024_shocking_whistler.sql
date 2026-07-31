CREATE TABLE "size_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "size_types_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "size_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "size_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"size_type_id" uuid NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "size_values_tenant_type_value_key" UNIQUE("tenant_id","size_type_id","value")
);
--> statement-breakpoint
ALTER TABLE "size_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "measurement_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_types_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "measurement_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "measurement_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"measurement_type_id" uuid NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "measurement_values_tenant_type_value_key" UNIQUE("tenant_id","measurement_type_id","value")
);
--> statement-breakpoint
ALTER TABLE "measurement_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "size_types" ADD CONSTRAINT "size_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_values" ADD CONSTRAINT "size_values_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_values" ADD CONSTRAINT "size_values_size_type_id_size_types_id_fk" FOREIGN KEY ("size_type_id") REFERENCES "public"."size_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_types" ADD CONSTRAINT "measurement_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_values" ADD CONSTRAINT "measurement_values_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_values" ADD CONSTRAINT "measurement_values_measurement_type_id_measurement_types_id_fk" FOREIGN KEY ("measurement_type_id") REFERENCES "public"."measurement_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "size_types_tenant_position_idx" ON "size_types" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE INDEX "size_values_tenant_type_idx" ON "size_values" USING btree ("tenant_id","size_type_id","position");--> statement-breakpoint
CREATE INDEX "measurement_types_tenant_position_idx" ON "measurement_types" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE INDEX "measurement_values_tenant_type_idx" ON "measurement_values" USING btree ("tenant_id","measurement_type_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "size_types" AS PERMISSIVE FOR ALL TO public USING ("size_types"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("size_types"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "size_values" AS PERMISSIVE FOR ALL TO public USING ("size_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("size_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "measurement_types" AS PERMISSIVE FOR ALL TO public USING ("measurement_types"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("measurement_types"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "measurement_values" AS PERMISSIVE FOR ALL TO public USING ("measurement_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("measurement_values"."tenant_id" = current_setting('app.tenant_id', true)::uuid);