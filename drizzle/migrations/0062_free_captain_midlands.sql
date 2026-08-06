CREATE TABLE "delivery_method_entity_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"delivery_method_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"api_key" text,
	"sender_counterparty_ref" text,
	"sender_counterparty" text,
	"sender_contact_person_ref" text,
	"sender_contact_person" text,
	"sender_phone" text,
	"sender_address_type" "delivery_method_sender_address_type" DEFAULT 'warehouse' NOT NULL,
	"sender_city_ref" text,
	"sender_city" text,
	"sender_warehouse_ref" text,
	"sender_address_or_warehouse" text,
	"sender_street_ref" text,
	"sender_street" text,
	"sender_house_number" text,
	"payer" "delivery_method_payer" DEFAULT 'recipient' NOT NULL,
	"declared_value_mode" "delivery_method_declared_value_mode" DEFAULT 'order_amount' NOT NULL,
	"declared_value_minimum" numeric(12, 2) DEFAULT '500',
	"description_content" "delivery_method_description_content" DEFAULT 'product_names' NOT NULL,
	"description_include_quantity" boolean DEFAULT true NOT NULL,
	"sync_frequency_minutes" integer,
	"order_return_on_refusal" boolean DEFAULT false NOT NULL,
	"use_carrier_packaging" boolean DEFAULT false NOT NULL,
	"marking_printer_type" "delivery_method_marking_printer_type" DEFAULT 'regular' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_method_entity_settings_method_entity_key" UNIQUE("tenant_id","delivery_method_id","legal_entity_id")
);
--> statement-breakpoint
ALTER TABLE "delivery_method_entity_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ALTER COLUMN "delivery_method_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ADD COLUMN "entity_settings_id" uuid;--> statement-breakpoint
ALTER TABLE "delivery_method_entity_settings" ADD CONSTRAINT "delivery_method_entity_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_method_entity_settings" ADD CONSTRAINT "delivery_method_entity_settings_delivery_method_id_delivery_methods_id_fk" FOREIGN KEY ("delivery_method_id") REFERENCES "public"."delivery_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_method_entity_settings" ADD CONSTRAINT "delivery_method_entity_settings_legal_entity_id_company_legal_entities_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."company_legal_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_method_entity_settings_tenant_method_idx" ON "delivery_method_entity_settings" USING btree ("tenant_id","delivery_method_id");--> statement-breakpoint
CREATE INDEX "delivery_method_entity_settings_tenant_entity_idx" ON "delivery_method_entity_settings" USING btree ("tenant_id","legal_entity_id");--> statement-breakpoint
ALTER TABLE "delivery_method_status_rules" ADD CONSTRAINT "delivery_method_status_rules_entity_settings_id_delivery_method_entity_settings_id_fk" FOREIGN KEY ("entity_settings_id") REFERENCES "public"."delivery_method_entity_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Перенесення реальних даних (2026-08-06, сьомий прохід): перш ніж дропати
-- старі колонки delivery_methods нижче, копіюємо їх значення (ключ НП,
-- відправник тощо) у новий рядок delivery_method_entity_settings — по одному
-- на пару (спосіб доставки, перша/єдина юридична особа тенанта). Тенанти без
-- жодного ФОП/ТОВ на цей момент просто не отримують рядків (нема кому їх
-- прив'язати) — не втрата даних, бо requires_api_key-конфігурації в такому
-- разі й так порожні.
INSERT INTO "delivery_method_entity_settings" (
	"id", "tenant_id", "delivery_method_id", "legal_entity_id",
	"api_key", "sender_counterparty_ref", "sender_counterparty", "sender_contact_person_ref", "sender_contact_person", "sender_phone",
	"sender_address_type", "sender_city_ref", "sender_city", "sender_warehouse_ref", "sender_address_or_warehouse", "sender_street_ref", "sender_street", "sender_house_number",
	"payer", "declared_value_mode", "declared_value_minimum", "description_content", "description_include_quantity",
	"sync_frequency_minutes", "order_return_on_refusal", "use_carrier_packaging", "marking_printer_type"
)
SELECT
	gen_random_uuid(), dm."tenant_id", dm."id", le."id",
	dm."api_key", dm."sender_counterparty_ref", dm."sender_counterparty", dm."sender_contact_person_ref", dm."sender_contact_person", dm."sender_phone",
	dm."sender_address_type", dm."sender_city_ref", dm."sender_city", dm."sender_warehouse_ref", dm."sender_address_or_warehouse", dm."sender_street_ref", dm."sender_street", dm."sender_house_number",
	dm."payer", dm."declared_value_mode", dm."declared_value_minimum", dm."description_content", dm."description_include_quantity",
	dm."sync_frequency_minutes", dm."auto_return_on_refusal", dm."use_carrier_packaging", dm."marking_printer_type"
FROM "delivery_methods" dm
JOIN LATERAL (
	SELECT "id" FROM "company_legal_entities" cle WHERE cle."tenant_id" = dm."tenant_id" ORDER BY cle."created_at" LIMIT 1
) le ON true;--> statement-breakpoint
UPDATE "delivery_method_status_rules" dmsr
SET "entity_settings_id" = dmes."id"
FROM "delivery_method_entity_settings" dmes
WHERE dmes."delivery_method_id" = dmsr."delivery_method_id"
	AND dmes."tenant_id" = dmsr."tenant_id";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "api_key";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_counterparty_ref";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_counterparty";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_contact_person_ref";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_contact_person";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_phone";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_address_type";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_city_ref";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_city";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_warehouse_ref";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_address_or_warehouse";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_street_ref";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_street";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sender_house_number";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "payer";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "declared_value_mode";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "declared_value_minimum";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "description_content";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "description_include_quantity";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "sync_frequency_minutes";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "auto_return_on_refusal";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "use_carrier_packaging";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "marking_printer_type";--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "delivery_method_entity_settings" AS PERMISSIVE FOR ALL TO public USING ("delivery_method_entity_settings"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("delivery_method_entity_settings"."tenant_id" = current_setting('app.tenant_id', true)::uuid);