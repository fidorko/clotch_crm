ALTER TABLE "delivery_methods" ADD COLUMN "sender_counterparty_ref" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_contact_person_ref" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_city_ref" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "sender_warehouse_ref" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "allowed_service_types" text[] DEFAULT '{"DoorsDoors","DoorsWarehouse","WarehouseWarehouse","WarehouseDoors","DoorsPostomat"}' NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "pack_ref" text;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD COLUMN "pack_description" text;