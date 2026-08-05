CREATE TABLE "receiving_document_item_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receiving_document_item_events_delta_nonzero" CHECK ("receiving_document_item_events"."delta" <> 0)
);
--> statement-breakpoint
ALTER TABLE "receiving_document_item_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "receiving_documents" ADD COLUMN "is_planned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "receiving_documents" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "receiving_document_item_events" ADD CONSTRAINT "receiving_document_item_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiving_document_item_events" ADD CONSTRAINT "receiving_document_item_events_item_id_receiving_document_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."receiving_document_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "receiving_document_item_events_tenant_item_idx" ON "receiving_document_item_events" USING btree ("tenant_id","item_id","created_at");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "receiving_document_item_events" AS PERMISSIVE FOR ALL TO public USING ("receiving_document_item_events"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("receiving_document_item_events"."tenant_id" = current_setting('app.tenant_id', true)::uuid);