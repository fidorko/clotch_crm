export type ProductStatus = "active" | "inactive" | "archived";

export interface ProductPhoto {
  id: string;
  url: string;
  alt: string;
}

export interface ProductSku {
  id: string;
  code: string;
  color: string;
  colorHex: string;
  size: string;
  barcode: string;
  stock: number;
  cell: string;
}

// Фото прив'язане до кольору товару (усі розміри цього кольору виглядають
// однаково на фото), не до окремого SKU — див. db.md.
export interface ProductColorPhotos {
  color: string;
  photos: ProductPhoto[];
}

export interface ProductTag {
  id: string;
  label: string;
}

export interface ProductMeasurement {
  id: string;
  type: string;
  valueCm: number;
}

export interface PriceModeValue {
  mode: "amount" | "percent";
  amount: number;
  percent: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryPath: string;
  // Реальний зв'язок із деревом categories (settings) — null, поки не обрано.
  // category/categoryPath лишаються окремо (вільний текст, хлібні крихти) — db.md.
  categoryId: string | null;
  // Реальний FK на suppliers (settings → Довідники) — null, поки не обрано.
  supplierId: string | null;
  status: ProductStatus;
  isDraft: boolean;
  modelCode: string;
  season: string;
  info: {
    // Єдине поле старої групи "info.*" без реального довідника — лишається
    // вільним текстом (не частина системи динамічних характеристик, db.md).
    gender: string;
    description: string;
  };
  // Значення динамічних характеристик, закріплених за категорією товару
  // (Бренд/Колекція/Сезон/Посадка/Виробник/Тип тканини/Інструкція по догляду/
  // довільні custom-характеристики) — characteristicKey -> valueId[], у
  // порядку. Значення резолвляться в лейбли через CategoryCharacteristicOption
  // (lib/categories/characteristic-options.ts), завантажені на сторінці
  // товару. db.md, modules/products.md.
  characteristics: Record<string, string[]>;
  // Розкладка складу тканини (характеристика "fabric-materials" — лише сам
  // обраний тип тканини; тут — матеріали з відсотками, напр. "бавовна 90%,
  // синтетика 10%").
  materialComposition: { materialId: string; percent: number }[];
  pricing: {
    purchasePrice: number;
    retail: PriceModeValue;
    oldPrice: number;
    wholesale: PriceModeValue;
    dropship: PriceModeValue;
    retailDiscount: PriceModeValue;
  };
  photos: ProductPhoto[];
  colorPhotos: ProductColorPhotos[];
  measurements: ProductMeasurement[];
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    internalCode: string;
    supplierCode: string;
    // null = не задано власне на товарі — успадковує ефективне значення
    // категорії (products-characteristics.md), той самий принцип, що
    // categories.default_*.
    packageLengthCm: number | null;
    packageWidthCm: number | null;
    packageHeightCm: number | null;
    packageWeightKg: number | null;
  };
  tags: ProductTag[];
  skus: ProductSku[];
  stats: {
    skuCount: number;
    inStockCount: number;
    outOfStockCount: number;
    totalStock: number;
    stockSumPurchase: number;
    stockSumRetail: number;
  };
}
