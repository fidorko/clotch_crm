ALTER TABLE "categories" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "is_active" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "show_in_storefront_section" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "show_in_storefront_section" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "show_in_header_menu" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "show_in_header_menu" DROP NOT NULL;