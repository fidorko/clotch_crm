// Фіксований набір полів вкладки «Технічні дані» картки товару (не
// категорійні динамічні характеристики — ProductGeneralTab/DynamicCharacteristicsSection,
// products-characteristics.md). Порядок — тенант-рівневий drag&drop,
// product_technical_layout (db.md).
export const TECHNICAL_FIELD_KEYS = [
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "supplier",
  "supplierCode",
  "packageDimensions",
  "packageWeight",
] as const;

export type TechnicalFieldKey = (typeof TECHNICAL_FIELD_KEYS)[number];

export const TECHNICAL_FIELD_LABELS: Record<TechnicalFieldKey, string> = {
  createdAt: "Створено",
  updatedAt: "Оновлено",
  createdBy: "Створив",
  updatedBy: "Останній редагував",
  supplier: "Постачальник",
  supplierCode: "Артикул постачальника",
  packageDimensions: "Розміри (ДхШхВ)",
  packageWeight: "Вага",
};

/**
 * Збережений тенант-рівневий порядок + дефолт для полів без власного рядка
 * (у кінці списку, той самий принцип, що resolveProductCharacteristicRows).
 * `availableKeys` — щоб виключити "supplier", коли постачальники не
 * закріплені за категорією (та сама гейтинг-логіка, що раніше в ProductMetaPanel).
 */
export function resolveTechnicalFieldOrder(
  layout: { fieldKey: string; position: number }[],
  availableKeys: readonly TechnicalFieldKey[] = TECHNICAL_FIELD_KEYS
): TechnicalFieldKey[] {
  const available = new Set(availableKeys);
  const ordered = layout
    .map((entry) => entry.fieldKey)
    .filter((key): key is TechnicalFieldKey => available.has(key as TechnicalFieldKey));
  const missing = availableKeys.filter((key) => !ordered.includes(key));
  return [...ordered, ...missing];
}
