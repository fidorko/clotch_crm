export interface Category {
  id: string;
  name: string;
  productsCount: number;
  isActive: boolean;
}

export const mockCategories: Category[] = [
  { id: "c1", name: "Шапки, шарфи", productsCount: 3, isActive: true },
  { id: "c2", name: "Шорти", productsCount: 38, isActive: true },
  { id: "c3", name: "Штани, лосини", productsCount: 63, isActive: true },
  { id: "c4", name: "Архів одягу", productsCount: 0, isActive: true },
  { id: "c5", name: "Боді", productsCount: 6, isActive: true },
  { id: "c6", name: "Сукні", productsCount: 91, isActive: true },
  { id: "c7", name: "Вишиванки", productsCount: 2, isActive: true },
  { id: "c8", name: "Джинси", productsCount: 45, isActive: true },
  { id: "c9", name: "Кардигани", productsCount: 25, isActive: true },
];
