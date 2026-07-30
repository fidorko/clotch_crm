// Тимчасовий довідник розмірів для конструктора SKU. Планово — довідник з БД.
export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

// Кольори тепер з БД (таблиця `colors`, settings → Довідники → Кольори) —
// форма {name, hex} лишається спільним UI-контрактом для конструктора SKU.
export interface ColorOption {
  name: string;
  hex: string;
}
