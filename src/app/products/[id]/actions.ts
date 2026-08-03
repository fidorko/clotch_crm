"use server";

import { revalidatePath } from "next/cache";
import {
  saveProduct as saveProductInDb,
  updateProductCategory as updateProductCategoryInDb,
  updateProductName as updateProductNameInDb,
  type SaveProductInput,
} from "@/server/data/products";
import {
  createSku as createSkuInDb,
  createSkus as createSkusInDb,
  deleteSku as deleteSkuInDb,
  deleteSkus as deleteSkusInDb,
  updateSkuBarcode as updateSkuBarcodeInDb,
  type CreateSkuInput,
} from "@/server/data/product-skus";
import {
  addColorPhoto,
  deleteColorPhoto,
  deleteColorPhotosByColor,
  setMainColorPhoto as setMainColorPhotoInDb,
} from "@/server/data/product-color-photos";
import { validateImageFile } from "@/server/images/validate-image";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import type { ProductPhoto, ProductSku } from "@/lib/types/product";
import {
  listProductActivityLog,
  type ProductActivityLogEntry,
} from "@/server/data/product-activity-log";

export async function updateProductName(productId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    // Загальна помилка користувачу, деталі — тільки в умові (conventions.md)
    throw new Error("Назва товару не може бути порожньою");
  }

  const tenantId = getDevTenantId();
  await updateProductNameInDb(tenantId, productId, trimmed);
  revalidatePath(`/products/${productId}`);
}

export async function updateProductCategory(productId: string, categoryId: string): Promise<void> {
  if (!categoryId) {
    throw new Error("Оберіть категорію");
  }

  const tenantId = getDevTenantId();
  await updateProductCategoryInDb(tenantId, productId, categoryId);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/settings");
}

/** Кнопка «Створити товар»/«Редагувати» в ProductHeader — зберігає всю форму разом. */
export async function saveProductAction(
  productId: string,
  input: SaveProductInput
): Promise<void> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error("Назва товару не може бути порожньою");
  }

  const tenantId = getDevTenantId();
  await saveProductInDb(tenantId, productId, { ...input, name: trimmedName });
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
}

/** Один SKU (клітинка "+" на перетині кольору й розміру в конструкторі матриці). */
export async function createSkuAction(input: CreateSkuInput): Promise<ProductSku> {
  const tenantId = getDevTenantId();
  const sku = await createSkuInDb(tenantId, input);
  revalidatePath(`/products/${input.productId}`);
  return sku;
}

/** «Автогенерація SKU» — пакетне створення для всіх відсутніх комбінацій кольір×розмір. */
export async function createSkusAction(
  productId: string,
  inputs: CreateSkuInput[]
): Promise<ProductSku[]> {
  const tenantId = getDevTenantId();
  const skus = await createSkusInDb(tenantId, inputs);
  revalidatePath(`/products/${productId}`);
  return skus;
}

export async function deleteSkuAction(skuId: string, productId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteSkuInDb(tenantId, skuId);
  revalidatePath(`/products/${productId}`);
}

/**
 * Штрихкод — жорстка привʼязка до SKU (пряма вказівка людини): унікальність у
 * межах тенанта перевіряється в БД (product-skus.ts), тут лише повертаємо
 * дружню помилку користувачу, деталі — в exception message з data-шару.
 */
export async function updateSkuBarcodeAction(
  skuId: string,
  productId: string,
  barcode: string
): Promise<ProductSku> {
  const tenantId = getDevTenantId();
  const sku = await updateSkuBarcodeInDb(tenantId, skuId, barcode.trim() || null);
  revalidatePath(`/products/${productId}`);
  return sku;
}

/** Видалення кольору/розміру цілком — усі SKU цього кольору/розміру одним запитом. */
export async function deleteSkusAction(skuIds: string[], productId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteSkusInDb(tenantId, skuIds);
  revalidatePath(`/products/${productId}`);
}

/**
 * Фото прив'язане до кольору (усі розміри цього кольору), не до окремого SKU —
 * колір може мати кілька SKU (по одному на розмір). Без ліміту кількості —
 * прибрано за прямою вказівкою людини (2026-08-03, раніше MAX_COLOR_PHOTOS = 3).
 */
export async function uploadColorPhotoAction(
  productId: string,
  color: string,
  formData: FormData
): Promise<ProductPhoto> {
  const tenantId = getDevTenantId();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Файл не передано");
  }
  const { data, mimeType } = await validateImageFile(file);
  const photo = await addColorPhoto(tenantId, productId, color, data, mimeType);
  revalidatePath(`/products/${productId}`);
  return photo;
}

export async function deleteColorPhotoAction(photoId: string, productId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteColorPhoto(tenantId, photoId);
  revalidatePath(`/products/${productId}`);
}

/** Видалення кольору цілком (ProductSkuTable → DeleteColorButton) чистить і всі його фото. */
export async function deleteColorPhotosAction(productId: string, color: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteColorPhotosByColor(tenantId, productId, color);
  revalidatePath(`/products/${productId}`);
}

/** Основне фото товару (ProductPhotoGallery, клік на фото) — щонайбільше одне на товар. */
export async function setMainColorPhotoAction(productId: string, photoId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await setMainColorPhotoInDb(tenantId, productId, photoId);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
}

/** «Показати ще» в журналі подій (ProductActivityLogSection) — курсор по occurredAt останнього вже показаного рядка. */
export async function loadMoreProductActivityAction(
  productId: string,
  beforeIso: string
): Promise<ProductActivityLogEntry[]> {
  const tenantId = getDevTenantId();
  return listProductActivityLog(tenantId, productId, new Date(beforeIso));
}
