"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  BrushCleaning,
  CircleSlash2,
  Droplet,
  DropletOff,
  Pencil,
  Percent,
  Thermometer,
  WashingMachine,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectRow } from "@/components/ui/select-row";
import { EditableSelectRow } from "@/components/ui/editable-select-row";
import { EditableNumberRow } from "@/components/ui/editable-number-row";
import { PriceModeRow } from "@/components/ui/price-mode-row";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CategoryTreeSelect } from "@/components/categories/CategoryTreeSelect";
import { getCategoryPath } from "@/lib/categories/tree";
import { SIZE_OPTIONS, type ColorOption } from "@/lib/constants/sku-variant-options";
import type { Product } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import { updateProductCategory } from "@/app/products/[id]/actions";
import { useProductEditor } from "@/components/products/ProductEditorContext";

// Тимчасовий довідник інструкцій по догляду. Планово — довідник з БД (див. db.md).
interface CareOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

const CARE_OPTIONS: CareOption[] = [
  { id: "machine-wash", label: "Машинне прання", icon: WashingMachine },
  { id: "hand-wash", label: "Ручне прання", icon: Droplet },
  { id: "no-wash", label: "Не прати", icon: DropletOff },
  { id: "no-bleach", label: "Не відбілювати", icon: Ban },
  { id: "iron-low", label: "Прасування при низькій т°", icon: Thermometer },
  { id: "no-iron", label: "Не прасувати", icon: CircleSlash2 },
  { id: "dry-clean", label: "Хімчистка", icon: BrushCleaning },
  { id: "tumble-dry", label: "Сушіння в барабані", icon: Wind },
] as const;

const DEFAULT_CARE_IDS = ["machine-wash", "no-bleach", "iron-low", "tumble-dry", "dry-clean"];

function CareInstructionsRow({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const selectedOptions = CARE_OPTIONS.filter((option) => selectedIds.includes(option.id));

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">Інструкція по догляду</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1 hover:border-input hover:bg-accent/50 data-popup-open:border-input">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            selectedOptions.map((option) => (
              <Tooltip key={option.id}>
                <TooltipTrigger render={<span className="flex items-center text-foreground" />}>
                  <option.icon className="size-4.5" />
                </TooltipTrigger>
                <TooltipContent>{option.label}</TooltipContent>
              </Tooltip>
            ))
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Інструкції по догляду</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CARE_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={selectedIds.includes(option.id)}
                onCheckedChange={() => onToggle(option.id)}
              >
                <option.icon className="size-4 text-muted-foreground" />
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

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

// Тимчасові варіанти для випадаючих списків. Планово — довідники з БД (див. db.md).
const COLLECTION_OPTIONS = ["Summer 2026", "Autumn 2026"];
const BRAND_OPTIONS = ["Zara", "H&M", "Mango", "Bershka", "Pull&Bear"];

const INFO_OPTIONS = {
  gender: ["Унісекс", "Чоловіча", "Жіноча", "Дитяча"],
  seasonType: ["Літо", "Зима", "Демісезон", "Всесезонний"],
  fit: ["Oversize", "Regular", "Slim", "Relaxed"],
  manufacturer: ["TrendStyle", "BasicWear", "UkrTextile"],
  material: [
    "95% Cotton, 5% Elastane",
    "100% Cotton",
    "80% Cotton, 20% Polyester",
    "60% Cotton, 40% Polyester",
  ],
  fabricType: ["Футер двонитка", "Футер тринитка", "Кулірна гладь", "Рибана"],
} as const satisfies Record<string, readonly string[]>;

type InfoField = keyof typeof INFO_OPTIONS;

const INFO_LABELS: Record<InfoField, string> = {
  gender: "Стать",
  seasonType: "Сезон",
  fit: "Посадка",
  manufacturer: "Виробник",
  material: "Матеріал",
  fabricType: "Тип тканини",
};

export function ProductInfoPanel({
  product,
  categories,
  colorOptions,
  pricing,
  onPricingChange,
  variantsEnabled,
}: {
  product: Product;
  categories: CategoryRow[];
  colorOptions: ColorOption[];
  pricing: Product["pricing"];
  onPricingChange: <K extends keyof Product["pricing"]>(
    field: K,
    value: Product["pricing"][K]
  ) => void;
  variantsEnabled: boolean;
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

  const collection = form.collection;
  const brand = form.brand;
  const colorNameOptions = colorOptions.map((color) => color.name);
  const [careIds, setCareIds] = useState(DEFAULT_CARE_IDS);
  const [singleColor, setSingleColor] = useState(colorNameOptions[0]);
  const [singleSize, setSingleSize] = useState(SIZE_OPTIONS[0]);

  function setCollection(value: string) {
    setFormField("collection", value);
  }

  function setBrand(value: string) {
    setFormField("brand", value);
  }

  function updateField(field: InfoField, value: string) {
    setFormField("info", { ...info, [field]: value });
  }

  function toggleCareId(id: string) {
    setCareIds((prev) =>
      prev.includes(id) ? prev.filter((careId) => careId !== id) : [...prev, id]
    );
  }

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
        </div>
        <EditableSelectRow label="Бренд" value={brand} options={BRAND_OPTIONS} onChange={setBrand} />
        {!variantsEnabled && (
          <>
            <SelectRow
              label="Колір"
              value={singleColor}
              options={colorNameOptions}
              onChange={setSingleColor}
            />
            <SelectRow
              label="Розмір"
              value={singleSize}
              options={SIZE_OPTIONS}
              onChange={setSingleSize}
            />
          </>
        )}
        <EditableSelectRow
          label="Колекція"
          value={collection}
          options={COLLECTION_OPTIONS}
          onChange={setCollection}
        />
        {(Object.keys(INFO_OPTIONS) as InfoField[]).map((field) => (
          <EditableSelectRow
            key={field}
            label={INFO_LABELS[field]}
            value={info[field]}
            options={INFO_OPTIONS[field]}
            onChange={(value) => updateField(field, value)}
          />
        ))}
        <CareInstructionsRow selectedIds={careIds} onToggle={toggleCareId} />
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
      </CardContent>
    </Card>
  );
}
