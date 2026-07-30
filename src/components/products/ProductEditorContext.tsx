"use client";

import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductStatus } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import { saveProductAction } from "@/app/products/[id]/actions";

interface ProductFormState {
  name: string;
  status: ProductStatus;
  categoryId: string;
  collection: string;
  info: Product["info"];
  pricing: Product["pricing"];
  meta: {
    supplier: string;
    brandCountry: string;
    internalCode: string;
    supplierCode: string;
    packageLengthCm: number;
    packageWidthCm: number;
    packageHeightCm: number;
    packageWeightKg: number;
  };
  tags: string[];
}

interface ProductEditorContextValue {
  form: ProductFormState;
  setField: <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => void;
  isDraft: boolean;
  isSaving: boolean;
  error: string | null;
  save: () => void;
}

const ProductEditorContext = createContext<ProductEditorContextValue | null>(null);

export function useProductEditor(): ProductEditorContextValue {
  const ctx = useContext(ProductEditorContext);
  if (!ctx) throw new Error("useProductEditor має використовуватись всередині ProductEditorProvider");
  return ctx;
}

// Легасі-фолбек для товарів без categoryId (до підключення реального дерева категорій) — та сама логіка, що раніше жила в ProductInfoPanel.
function initialCategoryId(product: Product, categories: CategoryRow[]): string {
  return (
    product.categoryId ??
    categories.find((c) => c.name === product.category)?.id ??
    categories[0]?.id ??
    ""
  );
}

/**
 * Єдине джерело стану всієї форми картки товару (ProductHeader + вкладка «Основне»)
 * — раніше ціна/характеристики/метадані/теги жили окремими useState у трьох різних
 * клієнтських компонентах і ніде не зберігались разом. Кнопка «Створити товар»
 * (чернетка) / «Редагувати» (наявний товар) в ProductHeader зберігає весь `form`
 * одним запитом (`saveProductAction`) і знімає прапорець чернетки.
 */
export function ProductEditorProvider({
  product,
  categories,
  children,
}: {
  product: Product;
  categories: CategoryRow[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [isDraft, setIsDraft] = useState(product.isDraft);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>({
    name: product.name,
    status: product.status,
    categoryId: initialCategoryId(product, categories),
    collection: product.collection,
    info: product.info,
    pricing: product.pricing,
    meta: {
      supplier: product.meta.supplier,
      brandCountry: product.meta.brandCountry,
      internalCode: product.meta.internalCode,
      supplierCode: product.meta.supplierCode,
      packageLengthCm: product.meta.packageLengthCm,
      packageWidthCm: product.meta.packageWidthCm,
      packageHeightCm: product.meta.packageHeightCm,
      packageWeightKg: product.meta.packageWeightKg,
    },
    tags: product.tags.map((tag) => tag.label),
  });

  function setField<K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        await saveProductAction(product.id, {
          name: form.name,
          status: form.status,
          categoryId: form.categoryId || null,
          collection: form.collection,
          info: form.info,
          pricing: form.pricing,
          meta: form.meta,
          tags: form.tags,
        });
        setIsDraft(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти товар");
      }
    });
  }

  const value = useMemo<ProductEditorContextValue>(
    () => ({ form, setField, isDraft, isSaving, error, save }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setField/save стабільні за задумом (замикання на product.id/router, не на form)
    [form, isDraft, isSaving, error]
  );

  return <ProductEditorContext.Provider value={value}>{children}</ProductEditorContext.Provider>;
}
