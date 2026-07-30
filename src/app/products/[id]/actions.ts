"use server";

import { revalidatePath } from "next/cache";
import {
  saveProduct as saveProductInDb,
  updateProductCategory as updateProductCategoryInDb,
  updateProductName as updateProductNameInDb,
  type SaveProductInput,
} from "@/server/data/products";
import { addProductPhoto, deleteProductPhoto } from "@/server/data/product-photos";
import {
  createSku as createSkuInDb,
  createSkus as createSkusInDb,
  deleteSku as deleteSkuInDb,
  deleteSkus as deleteSkusInDb,
  type CreateSkuInput,
} from "@/server/data/product-skus";
import {
  addColorPhoto,
  countColorPhotos,
  deleteColorPhoto,
  deleteColorPhotosByColor,
} from "@/server/data/product-color-photos";
import { deleteProductImageByUrl, saveProductImage } from "@/server/storage/product-images";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { MAX_COLOR_PHOTOS } from "@/lib/constants/color-photos";
import type { ProductPhoto, ProductSku } from "@/lib/types/product";

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

/** «Фото моделі» (ProductPhotoGallery) — завантаження одразу зберігається в БД. */
export async function uploadProductPhotoAction(
  productId: string,
  formData: FormData
): Promise<ProductPhoto> {
  const tenantId = getDevTenantId();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Файл не передано");
  }
  const { url } = await saveProductImage(tenantId, "products", file);
  const photo = await addProductPhoto(tenantId, productId, url, file.name);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  return photo;
}

export async function deleteProductPhotoAction(photoId: string, productId: string): Promise<void> {
  const tenantId = getDevTenantId();
  const url = await deleteProductPhoto(tenantId, photoId);
  if (url) await deleteProductImageByUrl(tenantId, "products", url);
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

/** Видалення кольору/розміру цілком — усі SKU цього кольору/розміру одним запитом. */
export async function deleteSkusAction(skuIds: string[], productId: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteSkusInDb(tenantId, skuIds);
  revalidatePath(`/products/${productId}`);
}

/**
 * Фото прив'язане до кольору (усі розміри цього кольору), не до окремого SKU —
 * колір може мати кілька SKU (по одному на розмір). Ліміт (MAX_COLOR_PHOTOS = 3)
 * перевіряється до збереження файлу на диск, щоб не лишати "осиротілий" файл.
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
  const existingCount = await countColorPhotos(tenantId, productId, color);
  if (existingCount >= MAX_COLOR_PHOTOS) {
    throw new Error(`Максимум ${MAX_COLOR_PHOTOS} фото на колір`);
  }
  const { url } = await saveProductImage(tenantId, "product-colors", file);
  const photo = await addColorPhoto(tenantId, productId, color, url);
  revalidatePath(`/products/${productId}`);
  return photo;
}

export async function deleteColorPhotoAction(photoId: string, productId: string): Promise<void> {
  const tenantId = getDevTenantId();
  const url = await deleteColorPhoto(tenantId, photoId);
  if (url) await deleteProductImageByUrl(tenantId, "product-colors", url);
  revalidatePath(`/products/${productId}`);
}

/** Видалення кольору цілком (ProductSkuTable → DeleteColorButton) чистить і всі його фото. */
export async function deleteColorPhotosAction(productId: string, color: string): Promise<void> {
  const tenantId = getDevTenantId();
  const urls = await deleteColorPhotosByColor(tenantId, productId, color);
  await Promise.all(urls.map((url) => deleteProductImageByUrl(tenantId, "product-colors", url)));
  revalidatePath(`/products/${productId}`);
}
