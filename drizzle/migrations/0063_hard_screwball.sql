ALTER TABLE "delivery_method_status_rules" DROP CONSTRAINT "delivery_method_status_rules_method_status_key";--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" DROP CONSTRAINT "delivery_method_status_rules_delivery_method_id_delivery_methods_id_fk";
--> statement-breakpoint
DROP INDEX "delivery_method_status_rules_method_position_idx";--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ALTER COLUMN "entity_settings_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "delivery_method_status_rules_entity_settings_position_idx" ON "delivery_method_status_rules" USING btree ("tenant_id","entity_settings_id","position");--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" DROP COLUMN "delivery_method_id";--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ADD CONSTRAINT "delivery_method_status_rules_entity_settings_status_key" UNIQUE("tenant_id","entity_settings_id","carrier_status");