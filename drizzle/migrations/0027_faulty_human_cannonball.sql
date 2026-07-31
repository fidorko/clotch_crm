DROP POLICY "tenant_isolation" ON "category_characteristic_excluded_values" CASCADE;--> statement-breakpoint
DROP TABLE "category_characteristic_excluded_values" CASCADE;--> statement-breakpoint
ALTER TABLE "category_characteristics" DROP COLUMN "enabled";