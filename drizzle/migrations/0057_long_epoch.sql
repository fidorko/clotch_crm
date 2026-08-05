ALTER TABLE "delivery_methods" DROP COLUMN "allowed_service_types";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "packaging";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "pack_ref";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "pack_description";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "label_format";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "waybill_format";--> statement-breakpoint
ALTER TABLE "delivery_methods" DROP COLUMN "printer_name";--> statement-breakpoint
DROP TYPE "public"."delivery_method_packaging";