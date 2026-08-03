"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableSelectRow } from "@/components/ui/editable-select-row";
import { EditableTextRow } from "@/components/ui/editable-text-row";
import { Textarea } from "@/components/ui/textarea";
import { CategoryTreeSelect } from "@/components/categories/CategoryTreeSelect";
import { getCategoryPath } from "@/lib/categories/tree";
import { ProductPricingPanel } from "@/components/products/ProductPricingPanel";
import type { Product } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import { updateProductCategory } from "@/app/products/[id]/actions";
import { useProductEditor } from "@/components/products/ProductEditorContext";

// "Стать" — єдине поле старої групи "info.*" без реального довідника, не
// частина системи динамічних характеристик (узгоджено з людиною), лишається
// хардкодом і фіксованим місцем одразу під категорією.
const GENDER_OPTIONS = ["Унісекс", "Чоловіча", "Жіноча", "Дитяча"];

/**
 * Основне про товар — перший крок заповнення картки (2026-08-03): категорія
 * стоїть першою свідомо, бо саме вона визначає, які характеристики, кольори,
 * розміри й заміри взагалі стануть доступні нижче по сторінці.
 * Характеристики винесені в ProductCharacteristicsPanel (окрема картка,
 * products.md). Ціни та маржа (2026-08-03, четвертий прохід) — тепер
 * рендеряться тут-таки, під основними полями, але окремим блоком
 * (ProductPricingPanel лишається самостійним компонентом/файлом — просто
 * викликається зсередини, а не як сусідня картка в ProductGeneralTab).
 */
export function ProductInfoPanel({
  product,
  categories,
  pricing,
  onPricingChange,
  isPricingBlocked,
}: {
  product: Product;
  categories: CategoryRow[];
  pricing: Product["pricing"];
  onPricingChange: <K extends keyof Product["pricing"]>(
    field: K,
    value: Product["pricing"][K]
  ) => void;
  // Категорія (у цій-таки картці) лишається клікабельною, навіть коли решта
  // картки заблокована для нового товару без обраної категорії — але ціни,
  // хоч тепер і рендеряться тут-таки, логічно частина того самого блокування,
  // що решта картки (ProductGeneralTab.isCategoryBlocked).
  isPricingBlocked: boolean;
}) {
  const router = useRouter();
  const { form, setField: setFormField, isDraft } = useProductEditor();
  const [isSavingCategory, startCategoryTransition] = useTransition();
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  const info = form.info;
  // Категорія — в спільній формі (ProductEditorContext), як і решта полів. Для вже
  // наявного товару вибір додатково зберігається одразу (як і раніше) — не чекаючи
  // натискання кнопки «Редагувати».
  const categoryId = form.categoryId;

  function handleCategoryChange(nextCategoryId: string) {
    const previous = categoryId;
    setFormField("categoryId", nextCategoryId);
    setCategoryError(null);
    if (isDraft) return;
    startCategoryTransition(async () => {
      try {
        await updateProductCategory(product.id, nextCategoryId);
        router.refresh();
      } catch (err) {
        setFormField("categoryId", previous);
        setCategoryError(err instanceof Error ? err.message : "Не вдалося зберегти категорію");
      }
    });
  }

  function setGender(value: string) {
    setFormField("info", { ...info, gender: value });
  }

  const meta = form.meta;
  const description = info.description;
  const internalCode = meta.internalCode;

  const setInternalCode = (value: string) => setFormField("meta", { ...meta, internalCode: value });
  const setDescription = (value: string) => setFormField("info", { ...info, description: value });

  return (
    <div className="flex h-full flex-col gap-4">
      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-sm font-medium">Основне</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border px-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 py-1.5">
              <span className="w-40 shrink-0 text-sm text-muted-foreground">Категорія</span>
              {isEditingCategory ? (
                <CategoryTreeSelect
                  categories={categories}
                  value={categoryId}
                  onChange={handleCategoryChange}
                  defaultOpen
                  onOpenChange={(open) => {
                    if (!open) setIsEditingCategory(false);
                  }}
                  triggerClassName="min-w-0 flex-1 justify-between"
                />
              ) : (
                <div className="flex flex-1 items-center justify-between">
                  <span className={cn("text-sm text-foreground", isSavingCategory && "opacity-60")}>
                    {/* Повна ієрархія (Батьківська / Дитина), не тільки кінцева категорія */}
                    {categoryId
                      ? getCategoryPath(categories, categoryId)
                          .map((c) => c.name)
                          .join(" / ")
                      : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingCategory(true)}
                    aria-label="Редагувати категорію"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
            {categoryError && <span className="pb-1.5 text-xs text-destructive">{categoryError}</span>}
            {isDraft && !categoryId && (
              <span className="pb-1.5 text-xs text-warning">
                Оберіть категорію — обов&apos;язково для нового товару, решта картки заблокована
              </span>
            )}
          </div>
          <EditableSelectRow label="Стать" value={info.gender} options={GENDER_OPTIONS} onChange={setGender} />
          <EditableTextRow
            label="Внутрішній артикул моделі"
            value={internalCode}
            onChange={setInternalCode}
          />
          <div className="py-2">
            <label htmlFor="product-description" className="mb-1 block text-sm text-muted-foreground">
              Опис
            </label>
            <Textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm text-foreground"
            />
          </div>
        </CardContent>
      </Card>
      <div className={cn(isPricingBlocked && "pointer-events-none opacity-40")}>
        <ProductPricingPanel pricing={pricing} onPricingChange={onPricingChange} />
      </div>
    </div>
  );
}
