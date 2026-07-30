// Тимчасові довідники кольору/розміру для конструктора SKU. Планово — довідники з БД.
export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

export interface ColorOption {
  name: string;
  hex: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Beige", hex: "#E8DCC8" },
  { name: "Grey", hex: "#9CA3AF" },
  { name: "Navy", hex: "#1E293B" },
  { name: "Khaki", hex: "#A3A380" },
  { name: "Red", hex: "#DC2626" },
  { name: "Olive", hex: "#5B5B3D" },
];
