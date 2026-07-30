CREATE TYPE "public"."supplier_type" AS ENUM('manufacturer', 'distributor', 'wholesaler', 'importer', 'other');--> statement-breakpoint
CREATE TYPE "public"."supplier_channel_kind" AS ENUM('messenger', 'social');--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" "supplier_type" DEFAULT 'other' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"website" text,
	"country" text,
	"city" text,
	"address" text,
	"postal_code" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_tenant_code_key" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "supplier_contacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"name" text NOT NULL,
	"job_title" text,
	"phone" text,
	"email" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "supplier_channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"kind" "supplier_channel_kind" NOT NULL,
	"channel" text NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "supplier_custom_fields" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier_custom_fields" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_channels" ADD CONSTRAINT "supplier_channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_channels" ADD CONSTRAINT "supplier_channels_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_custom_fields" ADD CONSTRAINT "supplier_custom_fields_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_custom_fields" ADD CONSTRAINT "supplier_custom_fields_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suppliers_tenant_created_idx" ON "suppliers" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "supplier_contacts_tenant_supplier_idx" ON "supplier_contacts" USING btree ("tenant_id","supplier_id","position");--> statement-breakpoint
CREATE INDEX "supplier_channels_tenant_supplier_idx" ON "supplier_channels" USING btree ("tenant_id","supplier_id","position");--> statement-breakpoint
CREATE INDEX "supplier_custom_fields_tenant_supplier_idx" ON "supplier_custom_fields" USING btree ("tenant_id","supplier_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "suppliers" AS PERMISSIVE FOR ALL TO public USING ("suppliers"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("suppliers"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "supplier_contacts" AS PERMISSIVE FOR ALL TO public USING ("supplier_contacts"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("supplier_contacts"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "supplier_channels" AS PERMISSIVE FOR ALL TO public USING ("supplier_channels"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("supplier_channels"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "supplier_custom_fields" AS PERMISSIVE FOR ALL TO public USING ("supplier_custom_fields"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("supplier_custom_fields"."tenant_id" = current_setting('app.tenant_id', true)::uuid);