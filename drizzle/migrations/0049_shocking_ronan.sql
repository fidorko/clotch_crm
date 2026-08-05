CREATE TABLE "order_statuses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"notify_after_hours" integer,
	"notify_user" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_statuses_tenant_name_key" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
ALTER TABLE "order_statuses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_statuses" ADD CONSTRAINT "order_statuses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_statuses_tenant_position_idx" ON "order_statuses" USING btree ("tenant_id","position");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "order_statuses" AS PERMISSIVE FOR ALL TO public USING ("order_statuses"."tenant_id" = current_setting('app.tenant_id', true)::uuid) WITH CHECK ("order_statuses"."tenant_id" = current_setting('app.tenant_id', true)::uuid);