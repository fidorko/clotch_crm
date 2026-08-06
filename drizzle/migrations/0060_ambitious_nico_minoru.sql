CREATE TABLE "payment_method_partial_amounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_method_partial_amounts_tenant_method_amount_key" UNIQUE("tenant_id","payment_method_id","amount")
);
--> statement-breakpoint
ALTER TABLE "payment_method_partial_amounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payment_method_partial_amounts" ADD CONSTRAINT "payment_method_partial_amounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method_partial_amounts" ADD CONSTRAINT "payment_method_partial_amounts_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_method_partial_amounts_tenant_method_idx" ON "payment_method_partial_amounts" USING btree ("tenant_id","payment_method_id","position");--> statement-breakpoint
ALTER TABLE "payment_methods" DROP COLUMN "partial_amount";--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "payment_method_partial_amounts" AS PERMISSIVE FOR ALL TO public USING ("payment_method_partial_amounts"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("payment_method_partial_amounts"."tenant_id" = current_setting('app.tenant_id', true)::uuid);