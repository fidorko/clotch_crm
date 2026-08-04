CREATE TABLE "receiving_document_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"product_sku_id" uuid NOT NULL,
	"ordered" integer DEFAULT 0 NOT NULL,
	"received" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receiving_document_items_tenant_document_sku_key" UNIQUE("tenant_id","document_id","product_sku_id"),
	CONSTRAINT "receiving_document_items_ordered_nonneg" CHECK ("receiving_document_items"."ordered" >= 0),
	CONSTRAINT "receiving_document_items_received_nonneg" CHECK ("receiving_document_items"."received" >= 0)
);
--> statement-breakpoint
ALTER TABLE "receiving_document_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "receiving_document_items" ADD CONSTRAINT "receiving_document_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiving_document_items" ADD CONSTRAINT "receiving_document_items_document_id_receiving_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."receiving_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiving_document_items" ADD CONSTRAINT "receiving_document_items_product_sku_id_product_skus_id_fk" FOREIGN KEY ("product_sku_id") REFERENCES "public"."product_skus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "receiving_document_items_tenant_document_idx" ON "receiving_document_items" USING btree ("tenant_id","document_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "receiving_document_items" AS PERMISSIVE FOR ALL TO public USING ("receiving_document_items"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("receiving_document_items"."tenant_id" = current_setting('app.tenant_id', true)::uuid);