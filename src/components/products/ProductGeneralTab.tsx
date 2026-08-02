"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductInfoPanel } from "@/components/products/ProductInfoPanel";
import { ProductPhotoGallery } from "@/components/products/ProductPhotoGallery";
import { ProductSkuSection } from "@/components/products/ProductSkuSection";
import { SKUDetail } from "@/components/products/SKUDetail";
import { useProductSkuMatrix } from "@/components/products/useProductSkuMatrix";
import { ProductStatsBar } from "@/components/products/ProductStatsBar";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import type { ColorOption } from "@/lib/constants/sku-variant-options";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import type { MaterialCompositionEntry } from "@/components/products/characteristics/MaterialCompositionRow";
import { updateCharacteristicLayoutAction } from "@/app/products/characteristic-layout-actions";
import { useProductEditor } from "@/components/products/ProductEditorContext";
import { selectedSku as defaultSelectedSku } from "@/lib/mocks/products";

type PanelKeys = { info: string[]; meta: string[] };

export function ProductGeneralTab({
  product,
  categories,
  colorOptions,
  sizeOptions,
  dynamicRows,
  careInstructions,
  fabricTypes,
  materials,
  tagsKey,
  dev,
}: {
  product: Product;
  categories: CategoryRow[];
  colorOptions: ColorOption[];
  sizeOptions: string[];
  dynamicRows: { info: ResolvedCharacteristicRow[]; meta: ResolvedCharacteristicRow[] };
  careInstructions: CareInstructionRow[];
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  tagsKey: string | null;
  dev: boolean;
}) {
  const router = useRouter();
  const { form, setField, isDraft } = useProductEditor();
  const pricing = form.pricing;
  // Категорія обов'язкова для нового товару (узгоджено з людиною) — доки її
  // не обрано, решта картки (фото/метадані/SKU) заблокована, крім самої
  // ProductInfoPanel, де живе поле категорії.
  const isCategoryBlocked = isDraft && !form.categoryId;
  const [editingLayout, setEditingLayout] = useState(false);
  const [draftKeys, setDraftKeys] = useState<PanelKeys | null>(null);
  const [isSavingLayout, startSavingLayout] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const rowByKey = useMemo(() => {
    const map = new Map<string, ResolvedCharacteristicRow>();
    for (const row of [...dynamicRows.info, ...dynamicRows.meta]) map.set(row.key, row);
    return map;
  }, [dynamicRows]);

  const savedKeys: PanelKeys = useMemo(
    () => ({ info: dynamicRows.info.map((r) => r.key), meta: dynamicRows.meta.map((r) => r.key) }),
    [dynamicRows]
  );
  const activeKeys = draftKeys ?? savedKeys;
  const infoRows = activeKeys.info.map((key) => rowByKey.get(key)).filter((r): r is ResolvedCharacteristicRow => Boolean(r));
  const metaRows = activeKeys.meta.map((key) => rowByKey.get(key)).filter((r): r is ResolvedCharacteristicRow => Boolean(r));

  function startEditingLayout() {
    setDraftKeys(savedKeys);
    setEditingLayout(true);
  }

  function cancelEditingLayout() {
    setDraftKeys(null);
    setEditingLayout(false);
  }

  function containerOf(id: string): "info" | "meta" {
    if (id === "info-panel") return "info";
    if (id === "meta-panel") return "meta";
    return activeKeys.info.includes(id) ? "info" : "meta";
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeKey = String(active.id);
    const overId = String(over.id);
    setDraftKeys((prev) => {
      const current = prev ?? savedKeys;
      const fromPanel = current.info.includes(activeKey) ? "info" : "meta";
      const toPanel = containerOf(overId);

      if (fromPanel === toPanel) {
        const list = current[fromPanel];
        const oldIndex = list.indexOf(activeKey);
        const newIndex = list.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return current;
        return { ...current, [fromPanel]: arrayMove(list, oldIndex, newIndex) };
      }

      const fromList = current[fromPanel].filter((k) => k !== activeKey);
      const toList = [...current[toPanel]];
      const insertAt = toList.indexOf(overId);
      toList.splice(insertAt === -1 ? toList.length : insertAt, 0, activeKey);
      return { ...current, [fromPanel]: fromList, [toPanel]: toList };
    });
  }

  function saveLayout() {
    const keys = draftKeys ?? savedKeys;
    startSavingLayout(async () => {
      await updateCharacteristicLayoutAction([
        ...keys.info.map((characteristicKey, position) => ({
          characteristicKey,
          panel: "info" as const,
          position,
        })),
        ...keys.meta.map((characteristicKey, position) => ({
          characteristicKey,
          panel: "meta" as const,
          position,
        })),
      ]);
      setDraftKeys(null);
      setEditingLayout(false);
      router.refresh();
    });
  }

  function handleCharacteristicChange(key: string, valueIds: string[]) {
    setField("characteristics", { ...form.characteristics, [key]: valueIds });
  }

  function handleMaterialCompositionChange(entries: MaterialCompositionEntry[]) {
    setField("materialComposition", entries);
  }

  function updatePricing<K extends keyof typeof pricing>(field: K, value: (typeof pricing)[K]) {
    setField("pricing", { ...pricing, [field]: value });
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
  const retailDiscountAmount =
    pricing.retailDiscount.mode === "percent"
      ? retailAmount * (1 - pricing.retailDiscount.percent / 100)
      : pricing.retailDiscount.amount;

  // Стан SKU-матриці (кольори/розміри/SKU) — спільний для ProductSkuSection
  // (таблиця) і SKUDetail (обраний SKU), сусідні колонки нижче, не одне
  // вкладене ціле (products.md, 2026-08-03 — прибрано перемикач "Варіації
  // Колір/Розмір", товар завжди веде облік варіаціями).
  const skuMatrix = useProductSkuMatrix({
    productId: product.id,
    modelCode: product.modelCode,
    initialSkus: product.skus,
    initialColorPhotos: product.colorPhotos,
  });
  const activeSkuDetail = skuMatrix.activeSku
    ? { ...defaultSelectedSku, code: skuMatrix.activeSku.code }
    : undefined;

  return (
    <>
      <DevBlockLabel name="ProductStatsBar" enabled={dev}>
        <ProductStatsBar stats={product.stats} />
      </DevBlockLabel>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {editingLayout
            ? "Перетягніть характеристики між панелями, щоб змінити розташування для всіх товарів"
            : null}
        </span>
        {editingLayout ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={cancelEditingLayout} disabled={isSavingLayout}>
              <X className="size-3.5" />
              Скасувати
            </Button>
            <Button type="button" size="sm" onClick={saveLayout} disabled={isSavingLayout}>
              Зберегти розташування
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startEditingLayout} className="ml-auto">
            <LayoutGrid className="size-3.5" />
            Редагувати розташування характеристик
          </Button>
        )}
      </div>

      {/* ProductInfoPanel тепер має обидві дропзони ("info-panel"/"meta-panel"
          — колишня ProductMetaPanel) в одній картці, DndContext лишається,
          бо drag&drop між ними все ще можливий (products.md, 2026-08-03). */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <DevBlockLabel name="ProductInfoPanel" enabled={dev}>
            <ProductInfoPanel
              product={product}
              categories={categories}
              pricing={pricing}
              onPricingChange={updatePricing}
              dynamicRows={infoRows}
              metaDynamicRows={metaRows}
              layoutEditMode={editingLayout}
              characteristics={form.characteristics}
              onCharacteristicChange={handleCharacteristicChange}
              careInstructions={careInstructions}
              fabricTypes={fabricTypes}
              materials={materials}
              materialComposition={form.materialComposition}
              onMaterialCompositionChange={handleMaterialCompositionChange}
              tagsKey={tagsKey}
            />
          </DevBlockLabel>
          <div className={cn("flex flex-col gap-4", isCategoryBlocked && "pointer-events-none opacity-40")}>
            <DevBlockLabel name="ProductSkuSection" enabled={dev}>
              <ProductSkuSection
                productId={product.id}
                colorOptions={colorOptions}
                sizeOptions={sizeOptions}
                matrix={skuMatrix}
              />
            </DevBlockLabel>
            <DevBlockLabel name="SKUDetail" enabled={dev}>
              <SKUDetail
                sku={activeSkuDetail}
                pricing={{
                  purchasePrice: pricing.purchasePrice,
                  retail: retailAmount,
                  oldPrice: pricing.oldPrice,
                  wholesale: wholesaleAmount,
                  dropship: dropshipAmount,
                  retailDiscount: retailDiscountAmount,
                }}
              />
            </DevBlockLabel>
          </div>
        </div>
      </DndContext>

      <div className={cn(isCategoryBlocked && "pointer-events-none opacity-40")}>
        <DevBlockLabel name="ProductPhotoGallery" enabled={dev}>
          <ProductPhotoGallery productId={product.id} photos={product.photos} />
        </DevBlockLabel>
      </div>
    </>
  );
}
