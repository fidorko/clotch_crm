"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductStatus } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import { saveProductAction } from "@/app/products/[id]/actions";

const AUTOSAVE_DEBOUNCE_MS = 500;
export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ProductFormState {
  name: string;
  status: ProductStatus;
  categoryId: string;
  supplierId: string;
  info: Product["info"];
  characteristics: Product["characteristics"];
  materialComposition: Product["materialComposition"];
  sizeMeasurements: Product["sizeMeasurements"];
  pricing: Product["pricing"];
  meta: {
    internalCode: string;
    supplierCode: string;
    packageLengthCm: number | null;
    packageWidthCm: number | null;
    packageHeightCm: number | null;
    packageWeightKg: number | null;
  };
  tags: string[];
}

interface ProductEditorContextValue {
  form: ProductFormState;
  setField: <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => void;
  isDraft: boolean;
  saveStatus: SaveStatus;
  error: string | null;
  /** Форсує збереження негайно (обходить debounce) — напр. кнопка "Спробувати ще" при помилці. */
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
 * Єдине джерело стану всієї форми картки товару (ProductHeader + вкладка «Основне»
 * + розмірна сітка) — раніше ціна/характеристики/метадані/теги жили окремими
 * useState у трьох різних клієнтських компонентах і ніде не зберігались разом.
 * Автозбереження (2026-08-02, за прямою вказівкою людини — "ідеально без кнопки
 * Зберегти"): кожен виклик `setField` (спрацьовує на blur/commit полів-рядків
 * (`EditableTextRow` тощо) чи одразу на вибір `Select`/`Switch` — ніколи на
 * кожне натискання клавіші, бо ці компоненти самі тримають чернетку, поки не
 * закомітять) перезапускає короткий debounce (500мс, лише щоб згладити кілька
 * майже одночасних змін в один запит) і зберігає ввесь `form` одним запитом
 * (`saveProductAction`), той самий, що раніше викликала кнопка. Перше успішне
 * автозбереження знімає прапорець чернетки — так само, як раніше робила кнопка
 * «Створити товар» (сама категорія, поки не обрана, і далі блокує картку —
 * `ProductGeneralTab.isCategoryBlocked`, це не змінювалось).
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<ProductFormState>({
    name: product.name,
    status: product.status,
    categoryId: initialCategoryId(product, categories),
    supplierId: product.supplierId ?? "",
    info: product.info,
    characteristics: product.characteristics,
    materialComposition: product.materialComposition,
    sizeMeasurements: product.sizeMeasurements,
    pricing: product.pricing,
    meta: {
      internalCode: product.meta.internalCode,
      supplierCode: product.meta.supplierCode,
      packageLengthCm: product.meta.packageLengthCm,
      packageWidthCm: product.meta.packageWidthCm,
      packageHeightCm: product.meta.packageHeightCm,
      packageWeightKg: product.meta.packageWeightKg,
    },
    tags: product.tags.map((tag) => tag.label),
  });

  async function persist(current: ProductFormState) {
    setSaveStatus("saving");
    setError(null);
    try {
      await saveProductAction(product.id, {
        name: current.name,
        status: current.status,
        categoryId: current.categoryId || null,
        supplierId: current.supplierId || null,
        info: current.info,
        characteristics: current.characteristics,
        materialComposition: current.materialComposition,
        sizeMeasurements: current.sizeMeasurements,
        pricing: current.pricing,
        meta: current.meta,
        tags: current.tags,
      });
      setIsDraft(false);
      setSaveStatus("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти товар");
      setSaveStatus("error");
    }
  }

  function setField<K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        void persist(next);
      }, AUTOSAVE_DEBOUNCE_MS);
      return next;
    });
  }

  // Форсоване збереження (обходить debounce) — кнопка "Спробувати ще" при saveStatus "error".
  function save() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    void persist(form);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const value = useMemo<ProductEditorContextValue>(
    () => ({ form, setField, isDraft, saveStatus, error, save }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setField/save стабільні за задумом (замикання на product.id/router, не на form)
    [form, isDraft, saveStatus, error]
  );

  return <ProductEditorContext.Provider value={value}>{children}</ProductEditorContext.Provider>;
}
