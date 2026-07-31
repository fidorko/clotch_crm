ALTER TABLE "product_tags" DROP CONSTRAINT "product_tags_product_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "product_tags" ALTER COLUMN "tag_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_tags" ADD COLUMN "characteristic_value_id" uuid;--> statement-breakpoint
ALTER TABLE "custom_characteristics" ADD COLUMN "system_key" text;--> statement-breakpoint
ALTER TABLE "custom_characteristics" ADD COLUMN "show_in_crm" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_characteristics" ADD COLUMN "show_on_storefront" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_characteristics" ADD COLUMN "participates_in_filters" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_characteristic_value_id_custom_characteristic_values_id_fk" FOREIGN KEY ("characteristic_value_id") REFERENCES "public"."custom_characteristic_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_tags_tenant_characteristic_value_idx" ON "product_tags" USING btree ("tenant_id","characteristic_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_characteristics_tenant_system_key_key" ON "custom_characteristics" USING btree ("tenant_id","system_key") WHERE "custom_characteristics"."system_key" is not null;