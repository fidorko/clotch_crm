DROP POLICY "tenant_isolation" ON "fabric_type_care_instructions" CASCADE;--> statement-breakpoint
DROP TABLE "fabric_type_care_instructions" CASCADE;--> statement-breakpoint
DROP POLICY "tenant_isolation" ON "fabric_type_composition" CASCADE;--> statement-breakpoint
DROP TABLE "fabric_type_composition" CASCADE;--> statement-breakpoint
DROP POLICY "tenant_isolation" ON "fabric_type_seasons" CASCADE;--> statement-breakpoint
DROP TABLE "fabric_type_seasons" CASCADE;--> statement-breakpoint
ALTER TABLE "fabric_types" ADD COLUMN "front_side" text;--> statement-breakpoint
ALTER TABLE "fabric_types" ADD COLUMN "back_side" text;--> statement-breakpoint
ALTER TABLE "fabric_types" ADD COLUMN "tactile_feel" text;--> statement-breakpoint
DROP TYPE "public"."fabric_season";