export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  productsCount: number;
  isActive: boolean;
}

// Ілюстративна дворівнева ієрархія (мок, без БД) — батьківська категорія,
// далі другорядні (діти) під нею; "Архів одягу" — окремий рівень без дітей.
export const mockCategories: Category[] = [
  { id: "clothing", parentId: null, name: "Одяг", productsCount: 0, isActive: true },
  { id: "shorts", parentId: "clothing", name: "Шорти", productsCount: 38, isActive: true },
  { id: "pants", parentId: "clothing", name: "Штани, лосини", productsCount: 63, isActive: true },
  { id: "jeans", parentId: "clothing", name: "Джинси", productsCount: 45, isActive: true },
  { id: "cardigans", parentId: "clothing", name: "Кардигани", productsCount: 25, isActive: true },

  { id: "dresses-group", parentId: null, name: "Сукні та боді", productsCount: 0, isActive: true },
  { id: "dresses", parentId: "dresses-group", name: "Сукні", productsCount: 91, isActive: true },
  { id: "bodysuits", parentId: "dresses-group", name: "Боді", productsCount: 6, isActive: true },
  { id: "vyshyvankas", parentId: "dresses-group", name: "Вишиванки", productsCount: 2, isActive: true },

  { id: "accessories", parentId: null, name: "Аксесуари", productsCount: 0, isActive: true },
  { id: "hats-scarves", parentId: "accessories", name: "Шапки, шарфи", productsCount: 3, isActive: true },

  { id: "archive", parentId: null, name: "Архів одягу", productsCount: 0, isActive: true },
];
