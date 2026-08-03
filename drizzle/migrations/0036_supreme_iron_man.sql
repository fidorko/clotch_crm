CREATE TABLE "category_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"data" "bytea" NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Наявні рядки посилались на файли на диску попереднього ПК (перед переїздом
-- на Supabase) — самих байтів у БД для них ніде не було й немає, відновити
-- нічим; чистимо, щоб додати NOT NULL колонки без даних для заповнення.
DELETE FROM "product_photos";--> statement-breakpoint
DELETE FROM "product_color_photos";--> statement-breakpoint
ALTER TABLE "product_photos" ADD COLUMN "data" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "product_photos" ADD COLUMN "mime_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_color_photos" ADD COLUMN "data" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "product_color_photos" ADD COLUMN "mime_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "category_images" ADD CONSTRAINT "category_images_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "category_images" AS PERMISSIVE FOR ALL TO public USING ("category_images"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("category_images"."tenant_id" = current_setting('app.tenant_id', true)::uuid);