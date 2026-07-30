CREATE TYPE "public"."price_mode" AS ENUM('amount', 'percent');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"category_path" text NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"model_code" text NOT NULL,
	"brand" text NOT NULL,
	"collection" text,
	"season" text,
	"gender" text,
	"season_type" text,
	"fit" text,
	"country_of_origin" text,
	"manufacturer" text,
	"material" text,
	"fabric_type" text,
	"description" text,
	"purchase_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"old_price" numeric(12, 2),
	"retail_mode" "price_mode" DEFAULT 'amount' NOT NULL,
	"retail_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"retail_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"wholesale_mode" "price_mode" DEFAULT 'amount' NOT NULL,
	"wholesale_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"wholesale_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"dropship_mode" "price_mode" DEFAULT 'amount' NOT NULL,
	"dropship_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"dropship_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"retail_discount_mode" "price_mode" DEFAULT 'percent' NOT NULL,
	"retail_discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"retail_discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"supplier" text,
	"brand_country" text,
	"internal_code" text,
	"supplier_code" text,
	"package_length_cm" smallint,
	"package_width_cm" smallint,
	"package_height_cm" smallint,
	"package_weight_kg" numeric(6, 2),
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_tenant_model_code_key" UNIQUE("tenant_id","model_code")
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_skus" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"code" text NOT NULL,
	"color" text NOT NULL,
	"color_hex" text NOT NULL,
	"size" text NOT NULL,
	"barcode" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"cell" text,
	"purchase_price_override" numeric(12, 2),
	"retail_price_override" numeric(12, 2),
	"old_price_override" numeric(12, 2),
	"wholesale_price_override" numeric(12, 2),
	"dropship_price_override" numeric(12, 2),
	"retail_discount_override" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_skus_stock_nonneg" CHECK ("product_skus"."stock" >= 0)
);
--> statement-breakpoint
ALTER TABLE "product_skus" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_measurements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value_cm" numeric(6, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_measurements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_tags" (
	"product_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	CONSTRAINT "product_tags_product_id_tag_id_pk" PRIMARY KEY("product_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "product_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_photos" ADD CONSTRAINT "product_photos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_photos" ADD CONSTRAINT "product_photos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_measurements" ADD CONSTRAINT "product_measurements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_measurements" ADD CONSTRAINT "product_measurements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_tenant_created_idx" ON "products" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "products_tenant_status_idx" ON "products" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "product_skus_tenant_product_idx" ON "product_skus" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_skus_tenant_code_key" ON "product_skus" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "product_skus_tenant_barcode_key" ON "product_skus" USING btree ("tenant_id","barcode") WHERE "product_skus"."barcode" is not null;--> statement-breakpoint
CREATE INDEX "product_photos_tenant_product_position_idx" ON "product_photos" USING btree ("tenant_id","product_id","position");--> statement-breakpoint
CREATE INDEX "product_measurements_tenant_product_idx" ON "product_measurements" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "product_tags_tenant_tag_idx" ON "product_tags" USING btree ("tenant_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_tenant_label_key" ON "tags" USING btree ("tenant_id","label");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "products" AS PERMISSIVE FOR ALL TO public USING ("products"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("products"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_skus" AS PERMISSIVE FOR ALL TO public USING ("product_skus"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_skus"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_photos" AS PERMISSIVE FOR ALL TO public USING ("product_photos"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_photos"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_measurements" AS PERMISSIVE FOR ALL TO public USING ("product_measurements"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_measurements"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_tags" AS PERMISSIVE FOR ALL TO public USING ("product_tags"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("product_tags"."tenant_id" = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tags" AS PERMISSIVE FOR ALL TO public USING ("tags"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("tags"."tenant_id" = current_setting('app.tenant_id', true)::uuid);