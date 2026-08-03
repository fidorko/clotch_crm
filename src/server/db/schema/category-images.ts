import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantIsolationPolicy } from "./rls";
import { tenants } from "./tenants";
import { bytea } from "./custom-types";

// Окрема таблиця, не колонка на categories: зображення завантажується одразу
// при виборі файлу (жива мініатюра ще до збереження форми) — той самий момент,
// що раніше писав файл на диск, а для чернетки /new категорія ще не має свого
// id. categories.image_url лишається text-посиланням на рядок цієї таблиці
// (/api/uploads/categories/<id>), сама схема categories не змінилась.
export const categoryImages = pgTable(
  "category_images",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    data: bytea("data").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [tenantIsolationPolicy(table.tenantId)]
).enableRLS();
