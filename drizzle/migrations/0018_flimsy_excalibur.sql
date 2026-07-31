CREATE TYPE "public"."fabric_season" AS ENUM('spring', 'summer', 'autumn', 'winter');--> statement-breakpoint
CREATE TYPE "public"."fabric_stretch" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "care_instructions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "care_instructions_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "care_instructions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fabric_type_care_instructions" (
	"tenant_id" uuid NOT NULL,
	"fabric_type_id" uuid NOT NULL,
	"care_instruction_id" uuid NOT NULL,
	CONSTRAINT "fabric_type_care_instructions_fabric_type_id_care_instruction_id_pk" PRIMARY KEY("fabric_type_id","care_instruction_id")
);
--> statement-breakpoint
ALTER TABLE "fabric_type_care_instructions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fabric_type_composition" (
	"tenant_id" uuid NOT NULL,
	"fabric_type_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"percent" smallint NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "fabric_type_composition_fabric_type_id_material_id_pk" PRIMARY KEY("fabric_type_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "fabric_type_composition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fabric_type_possible_materials" (
	"tenant_id" uuid NOT NULL,
	"fabric_type_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	CONSTRAINT "fabric_type_possible_materials_fabric_type_id_material_id_pk" PRIMARY KEY("fabric_type_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "fabric_type_possible_materials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fabric_type_seasons" (
	"tenant_id" uuid NOT NULL,
	"fabric_type_id" uuid NOT NULL,
	"season" "fabric_season" NOT NULL,
	CONSTRAINT "fabric_type_seasons_fabric_type_id_season_pk" PRIMARY KEY("fabric_type_id","season")
);
--> statement-breakpoint
ALTER TABLE "fabric_type_seasons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fabric_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"density" text,
	"stretch" "fabric_stretch",
	"recommended_use" text,
	"schema_image_url" text,
	"schema_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fabric_types_tenant_name_key" UNIQUE("tenant_id","name"),
	CONSTRAINT "fabric_types_tenant_code_key" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "fabric_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_instructions" ADD CONSTRAINT "care_instructions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_care_instructions" ADD CONSTRAINT "fabric_type_care_instructions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_care_instructions" ADD CONSTRAINT "fabric_type_care_instructions_fabric_type_id_fabric_types_id_fk" FOREIGN KEY ("fabric_type_id") REFERENCES "public"."fabric_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_care_instructions" ADD CONSTRAINT "fabric_type_care_instructions_care_instruction_id_care_instructions_id_fk" FOREIGN KEY ("care_instruction_id") REFERENCES "public"."care_instructions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_composition" ADD CONSTRAINT "fabric_type_composition_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_composition" ADD CONSTRAINT "fabric_type_composition_fabric_type_id_fabric_types_id_fk" FOREIGN KEY ("fabric_type_id") REFERENCES "public"."fabric_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_composition" ADD CONSTRAINT "fabric_type_composition_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_possible_materials" ADD CONSTRAINT "fabric_type_possible_materials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_possible_materials" ADD CONSTRAINT "fabric_type_possible_materials_fabric_type_id_fabric_types_id_fk" FOREIGN KEY ("fabric_type_id") REFERENCES "public"."fabric_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_possible_materials" ADD CONSTRAINT "fabric_type_possible_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_seasons" ADD CONSTRAINT "fabric_type_seasons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_type_seasons" ADD CONSTRAINT "fabric_type_seasons_fabric_type_id_fabric_types_id_fk" FOREIGN KEY ("fabric_type_id") REFERENCES "public"."fabric_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_types" ADD CONSTRAINT "fabric_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materials_tenant_position_idx" ON "materials" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE INDEX "care_instructions_tenant_position_idx" ON "care_instructions" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE INDEX "fabric_type_care_instructions_tenant_fabric_type_idx" ON "fabric_type_care_instructions" USING btree ("tenant_id","fabric_type_id");--> statement-breakpoint
CREATE INDEX "fabric_type_composition_tenant_fabric_type_idx" ON "fabric_type_composition" USING btree ("tenant_id","fabric_type_id");--> statement-breakpoint
CREATE INDEX "fabric_type_possible_materials_tenant_fabric_type_idx" ON "fabric_type_possible_materials" USING btree ("tenant_id","fabric_type_id");--> statement-breakpoint
CREATE INDEX "fabric_type_seasons_tenant_fabric_type_idx" ON "fabric_type_seasons" USING btree ("tenant_id","fabric_type_id");--> statement-breakpoint
CREATE INDEX "fabric_types_tenant_position_idx" ON "fabric_types" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "materials" AS PERMISSIVE FOR ALL TO public USING ("materials"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("materials"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "care_instructions" AS PERMISSIVE FOR ALL TO public USING ("care_instructions"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("care_instructions"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "fabric_type_care_instructions" AS PERMISSIVE FOR ALL TO public USING ("fabric_type_care_instructions"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("fabric_type_care_instructions"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "fabric_type_composition" AS PERMISSIVE FOR ALL TO public USING ("fabric_type_composition"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("fabric_type_composition"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "fabric_type_possible_materials" AS PERMISSIVE FOR ALL TO public USING ("fabric_type_possible_materials"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("fabric_type_possible_materials"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "fabric_type_seasons" AS PERMISSIVE FOR ALL TO public USING ("fabric_type_seasons"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("fabric_type_seasons"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "fabric_types" AS PERMISSIVE FOR ALL TO public USING ("fabric_types"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("fabric_types"."tenant_id" = current_setting('app.tenant_id', true)::uuid);