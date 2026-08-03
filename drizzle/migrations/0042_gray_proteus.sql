DROP POLICY "tenant_isolation" ON "warehouse_bin_locations" CASCADE;--> statement-breakpoint
DROP TABLE "warehouse_bin_locations" CASCADE;--> statement-breakpoint
ALTER TABLE "warehouses" DROP COLUMN "bin_generate_barcodes";--> statement-breakpoint
ALTER TABLE "warehouses" DROP COLUMN "bin_generate_qr";--> statement-breakpoint
ALTER TABLE "warehouses" DROP COLUMN "bin_streets_count";--> statement-breakpoint
ALTER TABLE "warehouses" DROP COLUMN "bin_racks_per_street";--> statement-breakpoint
ALTER TABLE "warehouses" DROP COLUMN "bin_cells_per_rack";