ALTER TABLE "receiving_documents" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "receiving_documents" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."receiving_document_status";--> statement-breakpoint
CREATE TYPE "public"."receiving_document_status" AS ENUM('awaiting_delivery', 'in_progress', 'completed', 'completed_with_discrepancy');--> statement-breakpoint
ALTER TABLE "receiving_documents" ALTER COLUMN "status" SET DATA TYPE "public"."receiving_document_status" USING "status"::"public"."receiving_document_status";--> statement-breakpoint
ALTER TABLE "receiving_documents" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "receiving_documents" DROP COLUMN "based_on_id";--> statement-breakpoint
DROP TYPE "public"."receiving_document_type";