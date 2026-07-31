CREATE TABLE "sizes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"chest" text,
	"waist" text,
	"hips" text,
	"int_jeans" text,
	"ua_ru" text,
	"eu" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sizes_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "sizes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sizes_tenant_position_idx" ON "sizes" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "sizes" AS PERMISSIVE FOR ALL TO public USING ("sizes"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("sizes"."tenant_id" = current_setting('app.tenant_id', true)::uuid);