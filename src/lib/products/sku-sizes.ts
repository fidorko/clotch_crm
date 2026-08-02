// Розміри товару — не окрема таблиця в БД (db.md), відновлюються зі списку
// вже персистентних SKU (product_skus.size, вільний текст). Спільна функція —
// той самий список потрібен і клієнтському конструктору SKU (ProductSkuSection),
// і серверній сторінці товару (розмірна сітка, ProductSizeChart).
export function deriveDistinctSizes(skus: { size: string }[]): string[] {
  return [...new Set(skus.map((s) => s.size))];
}
