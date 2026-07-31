DROP POLICY "tenant_isolation" ON "tags" CASCADE;--> statement-breakpoint
DROP TABLE "tags" CASCADE;--> statement-breakpoint
DROP INDEX "product_tags_tenant_tag_idx";--> statement-breakpoint
ALTER TABLE "product_tags" ALTER COLUMN "characteristic_value_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_characteristic_value_id_pk" PRIMARY KEY("product_id","characteristic_value_id");--> statement-breakpoint
ALTER TABLE "product_tags" DROP COLUMN "tag_id";