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
}

export interface ProductTag {
  id: string;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  breadcrumb: string[];
  status: ProductStatus;
  modelCode: string;
  brand: string;
  collection: string;
  season: string;
  info: {
    category: string;
    gender: string;
    seasonType: string;
    fit: string;
    countryOfOrigin: string;
    manufacturer: string;
    material: string;
    density: string;
    fabricType: string;
    description: string;
  };
  photos: ProductPhoto[];
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    supplier: string;
    brandCountry: string;
    modelBarcode: string;
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
