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
  status: ProductStatus;
  modelCode: string;
  brand: string;
  collection: string;
  season: string;
  info: {
    gender: string;
    seasonType: string;
    fit: string;
    countryOfOrigin: string;
    manufacturer: string;
    material: string;
    fabricType: string;
    description: string;
  };
  pricing: {
    purchasePrice: number;
    retail: PriceModeValue;
    oldPrice: number;
    wholesale: PriceModeValue;
    dropship: PriceModeValue;
    retailDiscount: PriceModeValue;
  };
  photos: ProductPhoto[];
  measurements: ProductMeasurement[];
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    supplier: string;
    brandCountry: string;
    internalCode: string;
    supplierCode: string;
    packageLengthCm: number;
    packageWidthCm: number;
    packageHeightCm: number;
    packageWeightKg: number;
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
