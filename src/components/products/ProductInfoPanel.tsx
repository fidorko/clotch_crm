"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { EditableSelectRow } from "@/components/ui/editable-select-row";
import { EditableNumberRow } from "@/components/ui/editable-number-row";
import { EditableTextRow } from "@/components/ui/editable-text-row";
import { PriceModeRow } from "@/components/ui/price-mode-row";
import { Textarea } from "@/components/ui/textarea";
import { CategoryTreeSelect } from "@/components/categories/CategoryTreeSelect";
import { getCategoryPath } from "@/lib/categories/tree";
import { DynamicCharacteristicsSection } from "@/components/products/characteristics/DynamicCharacteristicsSection";
import type { MaterialCompositionEntry } from "@/components/products/characteristics/MaterialCompositionRow";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import type { Product } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import { updateProductCategory } from "@/app/products/[id]/actions";
import { useProductEditor } from "@/components/products/ProductEditorContext";

function calcMarginPercent(sellPrice: number, purchasePrice: number) {
  if (sellPrice <= 0) return 0;
  return ((sellPrice - purchasePrice) / sellPrice) * 100;
}

function MarginTile({
  label,
  percent,
  amount,
}: {
  label: string;
  percent: number;
  amount: number;
}) {
  const isNegative = percent < 0;

  return (
    <div className="flex items-start gap-2">
      <Percent className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-sm font-medium text-foreground",
            isNegative && "text-destructive"
          )}
        >
          {percent.toFixed(1)}% · {amount.toFixed(2)} грн
        </span>
      </div>
    </div>
  );
}

function MarginRow({
  retailMarginPercent,
  retailMarginAmount,
  wholesaleMarginPercent,
  wholesaleMarginAmount,
  dropshipMarginPercent,
  dropshipMarginAmount,
}: {
  retailMarginPercent: number;
  retailMarginAmount: number;
  wholesaleMarginPercent: number;
  wholesaleMarginAmount: number;
  dropshipMarginPercent: number;
  dropshipMarginAmount: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <MarginTile
        label="Маржа роздріб"
        percent={retailMarginPercent}
        amount={retailMarginAmount}
      />
      <MarginTile
        label="Маржа опт"
        percent={wholesaleMarginPercent}
        amount={wholesaleMarginAmount}
      />
      <MarginTile
        label="Маржа дроп"
        percent={dropshipMarginPercent}
        amount={dropshipMarginAmount}
      />
    </div>
  );
}

// "Стать" — єдине поле старої групи "info.*" без реального довідника, не
// частина системи динамічних характеристик (узгоджено з людиною), лишається
// хардкодом і фіксованим місцем одразу під категорією.
const GENDER_OPTIONS = ["Унісекс", "Чоловіча", "Жіноча", "Дитяча"];

export function ProductInfoPanel({
  product,
  categories,
  pricing,
  onPricingChange,
  dynamicRows,
  metaDynamicRows,
  layoutEditMode,
  characteristics,
  onCharacteristicChange,
  careInstructions,
  fabricTypes,
  materials,
  materialComposition,
  onMaterialCompositionChange,
  tagsKey,
}: {
  product: Product;
  categories: CategoryRow[];
  pricing: Product["pricing"];
  onPricingChange: <K extends keyof Product["pricing"]>(
    field: K,
    value: Product["pricing"][K]
  ) => void;
  dynamicRows: ResolvedCharacteristicRow[];
  // Друга дропзона (dropId="meta-panel") — раніше окрема ProductMetaPanel,
  // тепер обидві живуть в одному ProductInfoPanel (products.md, 2026-08-03).
  metaDynamicRows: ResolvedCharacteristicRow[];
  layoutEditMode: boolean;
  characteristics: Record<string, string[]>;
  onCharacteristicChange: (key: string, valueIds: string[]) => void;
  careInstructions: CareInstructionRow[];
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  materialComposition: MaterialCompositionEntry[];
  onMaterialCompositionChange: (entries: MaterialCompositionEntry[]) => void;
  tagsKey: string | null;
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

  const setTags = (value: string[]) => setFormField("tags", value);

  const meta = form.meta;
  const description = info.description;
  const internalCode = meta.internalCode;

  function setMeta<K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) {
    setFormField("meta", { ...meta, [key]: value });
  }

  const setDescription = (value: string) => setFormField("info", { ...info, description: value });
  const setInternalCode = (value: string) => setMeta("internalCode", value);

  const retailAmount =
    pricing.retail.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.retail.percent / 100)
      : pricing.retail.amount;
  const wholesaleAmount =
    pricing.wholesale.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.wholesale.percent / 100)
      : pricing.wholesale.amount;
  const dropshipAmount =
    pricing.dropship.mode === "percent"
      ? pricing.purchasePrice * (1 + pricing.dropship.percent / 100)
      : pricing.dropship.amount;

  return (
    <Card className="h-full gap-0 py-4">
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
        <DynamicCharacteristicsSection
          dropId="info-panel"
          rows={dynamicRows}
          layoutEditMode={layoutEditMode}
          characteristics={characteristics}
          onCharacteristicChange={onCharacteristicChange}
          careInstructions={careInstructions}
          fabricTypes={fabricTypes}
          materials={materials}
          materialComposition={materialComposition}
          onMaterialCompositionChange={onMaterialCompositionChange}
          tagsKey={tagsKey}
          tags={form.tags}
          onTagsChange={setTags}
        />
        <EditableNumberRow
          label="Закупівельна ціна"
          value={pricing.purchasePrice}
          onChange={(value) => onPricingChange("purchasePrice", value)}
        />
        <PriceModeRow
          label="Моя роздрібна ціна"
          value={pricing.retail}
          onChange={(value) => onPricingChange("retail", value)}
          computeFromPercent={(percent) => pricing.purchasePrice * (1 + percent / 100)}
          warning={
            retailAmount < pricing.purchasePrice ? "Ціна нижча за закупівельну" : undefined
          }
        />
        <EditableNumberRow
          label="Перечеркнута ціна"
          value={pricing.oldPrice}
          onChange={(value) => onPricingChange("oldPrice", value)}
        />
        <PriceModeRow
          label="Моя оптова ціна"
          value={pricing.wholesale}
          onChange={(value) => onPricingChange("wholesale", value)}
          computeFromPercent={(percent) => pricing.purchasePrice * (1 + percent / 100)}
          warning={
            wholesaleAmount < pricing.purchasePrice ? "Ціна нижча за закупівельну" : undefined
          }
        />
        <PriceModeRow
          label="Моя ціна дропшипперам"
          value={pricing.dropship}
          onChange={(value) => onPricingChange("dropship", value)}
          computeFromPercent={(percent) => pricing.purchasePrice * (1 + percent / 100)}
          warning={
            dropshipAmount < pricing.purchasePrice ? "Ціна нижча за закупівельну" : undefined
          }
        />
        <PriceModeRow
          label="Знижка роздрібна"
          value={pricing.retailDiscount}
          onChange={(value) => onPricingChange("retailDiscount", value)}
          computeFromPercent={(percent) => retailAmount * (1 - percent / 100)}
        />
        <MarginRow
          retailMarginPercent={calcMarginPercent(retailAmount, pricing.purchasePrice)}
          retailMarginAmount={retailAmount - pricing.purchasePrice}
          wholesaleMarginPercent={calcMarginPercent(wholesaleAmount, pricing.purchasePrice)}
          wholesaleMarginAmount={wholesaleAmount - pricing.purchasePrice}
          dropshipMarginPercent={calcMarginPercent(dropshipAmount, pricing.purchasePrice)}
          dropshipMarginAmount={dropshipAmount - pricing.purchasePrice}
        />
        <DynamicCharacteristicsSection
          dropId="meta-panel"
          rows={metaDynamicRows}
          layoutEditMode={layoutEditMode}
          characteristics={characteristics}
          onCharacteristicChange={onCharacteristicChange}
          careInstructions={careInstructions}
          fabricTypes={fabricTypes}
          materials={materials}
          materialComposition={materialComposition}
          onMaterialCompositionChange={onMaterialCompositionChange}
          tagsKey={tagsKey}
          tags={form.tags}
          onTagsChange={setTags}
        />
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
  );
}
