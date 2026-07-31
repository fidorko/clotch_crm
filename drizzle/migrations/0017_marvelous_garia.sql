CREATE TABLE "reference_dictionary_flags" (
	"tenant_id" uuid NOT NULL,
	"dictionary_key" text NOT NULL,
	"show_in_crm" boolean DEFAULT true NOT NULL,
	"show_on_storefront" boolean DEFAULT true NOT NULL,
	"participates_in_filters" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reference_dictionary_flags_tenant_id_dictionary_key_pk" PRIMARY KEY("tenant_id","dictionary_key")
);
--> statement-breakpoint
ALTER TABLE "reference_dictionary_flags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reference_dictionary_flags" ADD CONSTRAINT "reference_dictionary_flags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "reference_dictionary_flags" AS PERMISSIVE FOR ALL TO public USING ("reference_dictionary_flags"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("reference_dictionary_flags"."tenant_id" = current_setting('app.tenant_id', true)::uuid);