CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"show_in_storefront_section" boolean DEFAULT true NOT NULL,
	"show_in_header_menu" boolean DEFAULT true NOT NULL,
	"default_weight_kg" numeric(6, 2),
	"default_length_cm" smallint,
	"default_width_cm" smallint,
	"default_height_cm" smallint,
	"seo_h1" text,
	"seo_meta_title" text,
	"seo_meta_description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_tenant_parent_idx" ON "categories" USING btree ("tenant_id","parent_id");--> statement-breakpoint
CREATE INDEX "categories_tenant_created_idx" ON "categories" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "categories" AS PERMISSIVE FOR ALL TO public USING ("categories"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("categories"."tenant_id" = current_setting('app.tenant_id', true)::uuid);