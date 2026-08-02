"use client";

import { useState, useTransition } from "react";
import { ProductSkuTable } from "@/components/products/ProductSkuTable";
import { ProductSkuDetailPanel } from "@/components/products/ProductSkuDetailPanel";
import {
  createSkuAction,
  createSkusAction,
  deleteColorPhotosAction,
  deleteSkuAction,
  deleteSkusAction,
} from "@/app/products/[id]/actions";
import type { ColorOption } from "@/lib/constants/sku-variant-options";
import type { ProductColorPhotos, ProductMeasurement, ProductPhoto, ProductSku } from "@/lib/types/product";
import { selectedSku as defaultSelectedSku } from "@/lib/mocks/products";

export interface SkuPricing {
  purchasePrice: number;
  retail: number;
  oldPrice: number;
  wholesale: number;
  dropship: number;
  retailDiscount: number;
}

export interface SkuColor {
  id: string;
  name: string;
  hex: string;
  photos: ProductPhoto[];
}

function colorCode(name: string) {
  const letters = name.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄ]/g, "").toUpperCase();
  return letters.slice(0, 3) || "COL";
}

function buildSkuCode(modelCode: string, color: SkuColor, size: string) {
  return `${modelCode.replace(/-/g, "")}-${colorCode(color.name)}-${size}`;
}

// Кольори/розміри — не окремі таблиці в БД (db.md), тому при завантаженні
// сторінки відновлюємо їх зі списку вже персистентних SKU товару. Фото кольору
// (product_color_photos) підтягуються за назвою кольору — самі не залежать
// від наявності SKU (можна завантажити фото ще до першого доданого розміру).
function deriveInitialColors(skus: ProductSku[], colorPhotos: ProductColorPhotos[]): SkuColor[] {
  const seen = new Map<string, SkuColor>();
  for (const sku of skus) {
    if (!seen.has(sku.color)) {
      const photos = colorPhotos.find((cp) => cp.color === sku.color)?.photos ?? [];
      seen.set(sku.color, { id: `c-${crypto.randomUUID()}`, name: sku.color, hex: sku.colorHex, photos });
    }
  }
  return [...seen.values()];
}

// Розміри вже присутні в SKU лишаються видимими, навіть якщо категорію
// перемкнули й розмір випав із pinned sizeOptions — інакше наявні SKU
// зникли б із сітки без видалення.
function deriveInitialSizes(skus: ProductSku[]): string[] {
  const present = new Set(skus.map((s) => s.size));
  return [...present];
}

export function ProductSkuSection({
  productId,
  modelCode,
  measurements,
  pricing,
  colorOptions,
  sizeOptions,
  initialSkus,
  initialColorPhotos,
}: {
  productId: string;
  modelCode: string;
  measurements: ProductMeasurement[];
  pricing: SkuPricing;
  colorOptions: ColorOption[];
  sizeOptions: string[];
  initialSkus: ProductSku[];
  initialColorPhotos: ProductColorPhotos[];
}) {
  const [colors, setColors] = useState<SkuColor[]>(() =>
    deriveInitialColors(initialSkus, initialColorPhotos)
  );
  const [sizes, setSizes] = useState<string[]>(() => deriveInitialSizes(initialSkus));
  const [skus, setSkus] = useState<ProductSku[]>(initialSkus);
  const [selectedSkuId, setSelectedSkuId] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addColor(color: ColorOption) {
    setColors((prev) => [...prev, { id: `c-${crypto.randomUUID()}`, ...color, photos: [] }]);
  }

  function addSize(size: string) {
    setSizes((prev) => [...prev, size]);
  }

  function addSku(color: SkuColor, size: string) {
    setError(null);
    startTransition(async () => {
      try {
        const sku = await createSkuAction({
          productId,
          code: buildSkuCode(modelCode, color, size),
          color: color.name,
          colorHex: color.hex,
          size,
        });
        setSkus((prev) => [...prev, sku]);
        setSelectedSkuId(sku.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося створити SKU");
      }
    });
  }

  function deleteSku(skuId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteSkuAction(skuId, productId);
        setSkus((prev) => prev.filter((s) => s.id !== skuId));
        setSelectedSkuId((prev) => (prev === skuId ? undefined : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити SKU");
      }
    });
  }

  function deleteColor(colorId: string) {
    const color = colors.find((c) => c.id === colorId);
    if (!color) return;
    const skuIdsToDelete = skus.filter((s) => s.color === color.name).map((s) => s.id);
    setError(null);
    startTransition(async () => {
      try {
        if (skuIdsToDelete.length > 0) await deleteSkusAction(skuIdsToDelete, productId);
        if (color.photos.length > 0) await deleteColorPhotosAction(productId, color.name);
        setColors((prev) => prev.filter((c) => c.id !== colorId));
        setSkus((prev) => prev.filter((s) => s.color !== color.name));
        setSelectedSkuId((prev) => {
          const removed = skus.find((s) => s.id === prev);
          return removed && removed.color === color.name ? undefined : prev;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити колір");
      }
    });
  }

  function deleteSize(size: string) {
    const skuIdsToDelete = skus.filter((s) => s.size === size).map((s) => s.id);
    setError(null);
    startTransition(async () => {
      try {
        if (skuIdsToDelete.length > 0) await deleteSkusAction(skuIdsToDelete, productId);
        setSizes((prev) => prev.filter((s) => s !== size));
        setSkus((prev) => prev.filter((s) => s.size !== size));
        setSelectedSkuId((prev) => {
          const removed = skus.find((s) => s.id === prev);
          return removed && removed.size === size ? undefined : prev;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити розмір");
      }
    });
  }

  function autoGenerate() {
    const existing = new Set(skus.map((s) => `${s.color}__${s.size}`));
    const inputs = colors.flatMap((color) =>
      sizes
        .filter((size) => !existing.has(`${color.name}__${size}`))
        .map((size) => ({
          productId,
          code: buildSkuCode(modelCode, color, size),
          color: color.name,
          colorHex: color.hex,
          size,
        }))
    );
    if (inputs.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        const created = await createSkusAction(productId, inputs);
        setSkus((prev) => [...prev, ...created]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося автогенерувати SKU");
      }
    });
  }

  function updateColorPhotos(colorId: string, photos: ProductPhoto[]) {
    setColors((prev) => prev.map((c) => (c.id === colorId ? { ...c, photos } : c)));
  }

  const activeSku = skus.find((s) => s.id === selectedSkuId);

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <ProductSkuTable
          productId={productId}
          colors={colors}
          colorOptions={colorOptions}
          sizeOptions={sizeOptions}
          sizes={sizes}
          skus={skus}
          selectedSkuId={selectedSkuId}
          onSelect={setSelectedSkuId}
          onAddColor={addColor}
          onAddSize={addSize}
          onAddSku={addSku}
          onDeleteSku={deleteSku}
          onDeleteColor={deleteColor}
          onDeleteSize={deleteSize}
          onAutoGenerate={autoGenerate}
          onColorPhotosChange={updateColorPhotos}
          disabled={isPending}
        />
        <ProductSkuDetailPanel
          sku={activeSku ? { ...defaultSelectedSku, code: activeSku.code } : undefined}
          measurements={measurements}
          pricing={pricing}
        />
      </div>
    </div>
  );
}
