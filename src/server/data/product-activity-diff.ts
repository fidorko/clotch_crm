import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { categories, suppliers } from "@/server/db/schema";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/constants/product-status";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Лише прямі скалярні колонки products — junction-таблиці (характеристики/
// склад тканини/заміри/теги) НЕ діфляться тут: значення там — id довідників,
// що резолвляться в лейбли лише на клієнті (characteristicOptions,
// page.tsx), а не всередині saveProduct; лишається відкритим пунктом
// (modules/products.md).
export const PRODUCT_ACTIVITY_FIELD_LABELS: Record<string, string> = {
  name: "Назва",
  status: "Статус",
  categoryId: "Категорія",
  supplierId: "Постачальник",
  gender: "Стать",
  description: "Опис",
  purchasePrice: "Закупівельна ціна",
  oldPrice: "Перекреслена ціна",
  retailMode: "Роздрібна ціна — режим",
  retailAmount: "Роздрібна ціна",
  retailPercent: "Роздрібна ціна, %",
  wholesaleMode: "Оптова ціна — режим",
  wholesaleAmount: "Оптова ціна",
  wholesalePercent: "Оптова ціна, %",
  dropshipMode: "Дропшип-ціна — режим",
  dropshipAmount: "Дропшип-ціна",
  dropshipPercent: "Дропшип-ціна, %",
  retailDiscountMode: "Знижка — режим",
  retailDiscountAmount: "Знижка",
  retailDiscountPercent: "Знижка, %",
  internalCode: "Внутрішній артикул моделі",
  supplierCode: "Артикул постачальника",
  packageLengthCm: "Довжина посилки, см",
  packageWidthCm: "Ширина посилки, см",
  packageHeightCm: "Висота посилки, см",
  packageWeightKg: "Вага посилки, кг",
};

// numeric(...)-колонки повертаються з postgres.js як текст ("1200.00") —
// порівняння як рядків хибно ловило б "зміну" при кожному автозбереженні,
// навіть коли число те саме (клієнт шле "1200", БД повертає "1200.00").
const NUMERIC_FIELD_KEYS = new Set([
  "purchasePrice",
  "oldPrice",
  "retailAmount",
  "retailPercent",
  "wholesaleAmount",
  "wholesalePercent",
  "dropshipAmount",
  "dropshipPercent",
  "retailDiscountAmount",
  "retailDiscountPercent",
  "packageWeightKg",
]);
const INTEGER_FIELD_KEYS = new Set(["packageLengthCm", "packageWidthCm", "packageHeightCm"]);
const MODE_FIELD_KEYS = new Set(["retailMode", "wholesaleMode", "dropshipMode", "retailDiscountMode"]);

function valuesEqual(key: string, oldRaw: unknown, newRaw: unknown): boolean {
  if (NUMERIC_FIELD_KEYS.has(key) || INTEGER_FIELD_KEYS.has(key)) {
    const a = oldRaw === null || oldRaw === undefined ? null : Number(oldRaw);
    const b = newRaw === null || newRaw === undefined ? null : Number(newRaw);
    return a === b;
  }
  const a = oldRaw === null || oldRaw === undefined ? "" : String(oldRaw);
  const b = newRaw === null || newRaw === undefined ? "" : String(newRaw);
  return a === b;
}

function formatFieldValue(
  key: string,
  raw: unknown,
  categoryNameById: Map<string, string>,
  supplierNameById: Map<string, string>
): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  if (key === "status") {
    return PRODUCT_STATUS_OPTIONS.find((o) => o.value === raw)?.label ?? String(raw);
  }
  if (key === "categoryId") return categoryNameById.get(String(raw)) ?? String(raw);
  if (key === "supplierId") return supplierNameById.get(String(raw)) ?? String(raw);
  if (MODE_FIELD_KEYS.has(key)) return raw === "percent" ? "відсоток" : "сума";
  if (NUMERIC_FIELD_KEYS.has(key) || INTEGER_FIELD_KEYS.has(key)) return String(Number(raw));
  return String(raw);
}

export interface ProductFieldChange {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
}

/**
 * Порівнює рядок products ДО update (`before`, сирий рядок з БД) з полями,
 * які saveProduct от-от запише (`next`) — повертає лише реально змінені
 * (числові колонки порівнюються як числа, не рядки, `db.md`). Категорія/
 * Постачальник резолвляться в людську назву одним батч-запитом (не по
 * одному в циклі — правило "N+1 заборонено", розділ 7 CLAUDE.md).
 */
export async function diffProductFields(
  tx: Tx,
  tenantId: string,
  before: Record<string, unknown>,
  next: Record<string, unknown>
): Promise<ProductFieldChange[]> {
  const rawChanges = Object.keys(PRODUCT_ACTIVITY_FIELD_LABELS)
    .filter((key) => key in next && !valuesEqual(key, before[key], next[key]))
    .map((key) => ({ key, oldRaw: before[key], newRaw: next[key] }));

  if (rawChanges.length === 0) return [];

  const categoryIds = [
    ...new Set(
      rawChanges
        .filter((c) => c.key === "categoryId")
        .flatMap((c) => [c.oldRaw, c.newRaw])
        .filter((v): v is string => typeof v === "string")
    ),
  ];
  const supplierIds = [
    ...new Set(
      rawChanges
        .filter((c) => c.key === "supplierId")
        .flatMap((c) => [c.oldRaw, c.newRaw])
        .filter((v): v is string => typeof v === "string")
    ),
  ];

  const [categoryRows, supplierRows] = await Promise.all([
    categoryIds.length
      ? tx
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(and(eq(categories.tenantId, tenantId), inArray(categories.id, categoryIds)))
      : Promise.resolve([]),
    supplierIds.length
      ? tx
          .select({ id: suppliers.id, name: suppliers.name })
          .from(suppliers)
          .where(and(eq(suppliers.tenantId, tenantId), inArray(suppliers.id, supplierIds)))
      : Promise.resolve([]),
  ]);
  const categoryNameById = new Map(categoryRows.map((r) => [r.id, r.name]));
  const supplierNameById = new Map(supplierRows.map((r) => [r.id, r.name]));

  return rawChanges.map((change) => ({
    key: change.key,
    label: PRODUCT_ACTIVITY_FIELD_LABELS[change.key],
    oldValue: formatFieldValue(change.key, change.oldRaw, categoryNameById, supplierNameById),
    newValue: formatFieldValue(change.key, change.newRaw, categoryNameById, supplierNameById),
  }));
}
