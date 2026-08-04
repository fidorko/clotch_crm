CREATE TYPE "public"."receiving_document_status" AS ENUM('draft', 'expected', 'posted');--> statement-breakpoint
CREATE TYPE "public"."receiving_document_type" AS ENUM('planned', 'actual');--> statement-breakpoint
CREATE TYPE "public"."receiving_ttn_carrier" AS ENUM('nova_poshta', 'ukrposhta');--> statement-breakpoint
CREATE TABLE "receiving_document_custom_fields" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receiving_document_custom_fields" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "receiving_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" text NOT NULL,
	"type" "receiving_document_type" NOT NULL,
	"status" "receiving_document_status" DEFAULT 'draft' NOT NULL,
	"based_on_id" uuid,
	"supplier_id" uuid,
	"warehouse_id" uuid,
	"planned_date" date,
	"supplier_document" text,
	"ttn_carrier" "receiving_ttn_carrier",
	"ttn_number" text,
	"responsible_person" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receiving_documents_tenant_number_key" UNIQUE("tenant_id","number")
);
--> statement-breakpoint
ALTER TABLE "receiving_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "receiving_document_custom_fields" ADD CONSTRAINT "receiving_document_custom_fields_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiving_document_custom_fields" ADD CONSTRAINT "receiving_document_custom_fields_document_id_receiving_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."receiving_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiving_documents" ADD CONSTRAINT "receiving_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiving_documents" ADD CONSTRAINT "receiving_documents_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiving_documents" ADD CONSTRAINT "receiving_documents_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "receiving_document_custom_fields_tenant_document_idx" ON "receiving_document_custom_fields" USING btree ("tenant_id","document_id","position");--> statement-breakpoint
CREATE INDEX "receiving_documents_tenant_created_idx" ON "receiving_documents" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "receiving_document_custom_fields" AS PERMISSIVE FOR ALL TO public USING ("receiving_document_custom_fields"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("receiving_document_custom_fields"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "receiving_documents" AS PERMISSIVE FOR ALL TO public USING ("receiving_documents"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("receiving_documents"."tenant_id" = current_setting('app.tenant_id', true)::uuid);