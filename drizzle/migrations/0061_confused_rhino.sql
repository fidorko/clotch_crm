CREATE TYPE "public"."company_legal_entity_type" AS ENUM('fop', 'tov');--> statement-breakpoint
CREATE TABLE "general_settings" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"website" text,
	"email" text,
	"contact_person_name" text,
	"contact_person_position" text,
	"contact_person_phone" text,
	"work_hours" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "general_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "company_legal_entities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "company_legal_entity_type" DEFAULT 'fop' NOT NULL,
	"name" text NOT NULL,
	"edrpou" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_legal_entities_tenant_edrpou_key" UNIQUE("tenant_id","edrpou")
);
--> statement-breakpoint
ALTER TABLE "company_legal_entities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "general_settings" ADD CONSTRAINT "general_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_legal_entities" ADD CONSTRAINT "company_legal_entities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_legal_entities_tenant_position_idx" ON "company_legal_entities" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "general_settings" AS PERMISSIVE FOR ALL TO public USING ("general_settings"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("general_settings"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "company_legal_entities" AS PERMISSIVE FOR ALL TO public USING ("company_legal_entities"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("company_legal_entities"."tenant_id" = current_setting('app.tenant_id', true)::uuid);