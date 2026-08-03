"use client";

import { PointerSensor, closestCenter, useSensor, useSensors, DndContext } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ProductInfoPanel } from "@/components/products/ProductInfoPanel";
import { ProductCharacteristicsPanel } from "@/components/products/ProductCharacteristicsPanel";
import { ProductPhotoGallery } from "@/components/products/ProductPhotoGallery";
import { ProductSkuSection } from "@/components/products/ProductSkuSection";
import { SKUDetail } from "@/components/products/SKUDetail";
import { useProductSkuMatrix } from "@/components/products/useProductSkuMatrix";
import { ProductStatsBar } from "@/components/products/ProductStatsBar";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import type { Product } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import type { ColorOption } from "@/lib/constants/sku-variant-options";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import type { MaterialCompositionEntry } from "@/components/products/characteristics/MaterialCompositionRow";
import { useProductEditor } from "@/components/products/ProductEditorContext";
import { useCharacteristicLayout } from "@/components/products/ProductCharacteristicLayoutContext";
import { selectedSku as defaultSelectedSku } from "@/lib/mocks/products";

export function ProductGeneralTab({
  product,
  categories,
  colorOptions,
  sizeOptions,
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
  careInstructions: CareInstructionRow[];
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  tagsKey: string | null;
  dev: boolean;
}) {
  const { form, setField, isDraft } = useProductEditor();
  const pricing = form.pricing;
  // Категорія обов'язкова для нового товару (узгоджено з людиною) — доки її
  // не обрано, решта картки (фото/характеристики/SKU/ціни) заблокована, крім
  // самої ProductInfoPanel, де живе поле категорії.
  const isCategoryBlocked = isDraft && !form.categoryId;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const { infoRows, metaRows, editingLayout, handleDragEnd } = useCharacteristicLayout();

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
  // barcode — реальне поле (product_skus.barcode), не мок; решта (reserve/
  // available/cells/batch) лишається мок-заглушкою, окремий відкритий пункт
  // (products.md) — не стосується жорсткої привʼязки штрихкоду до SKU.
  const activeSkuDetail = skuMatrix.activeSku
    ? { ...defaultSelectedSku, id: skuMatrix.activeSku.id, code: skuMatrix.activeSku.code, barcode: skuMatrix.activeSku.barcode }
    : undefined;

  return (
    <>
      <DevBlockLabel name="ProductStatsBar" enabled={dev}>
        <ProductStatsBar stats={product.stats} />
      </DevBlockLabel>

      {editingLayout && (
        <p className="text-xs text-muted-foreground">
          Перетягніть характеристики між панелями, щоб змінити розташування для всіх товарів
        </p>
      )}

      {/* 2026-08-03, п'ятий прохід (за зауваженнями людини): відступи зменшено з
          5%-по-ширині (виявились завеликими на широких екранах) на звичайний
          фіксований gap-4. Обидва ряди — без items-start: типова поведінка
          CSS-грід (stretch) вирівнює блоки в рядку по висоті найвищого — кожен
          блок має h-full, щоб видимо заповнити стретчнуту комірку. */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={cn("h-full", isCategoryBlocked && "pointer-events-none opacity-40")}>
              <DevBlockLabel name="ProductPhotoGallery" enabled={dev} stretch>
                <ProductPhotoGallery
                  colors={skuMatrix.colors}
                  onSetMainPhoto={skuMatrix.setMainPhoto}
                  onDeletePhoto={skuMatrix.deletePhoto}
                />
              </DevBlockLabel>
            </div>
            <div className="h-full">
              <DevBlockLabel name="ProductInfoPanel" enabled={dev} stretch>
                <ProductInfoPanel
                  product={product}
                  categories={categories}
                  pricing={pricing}
                  onPricingChange={updatePricing}
                  isPricingBlocked={isCategoryBlocked}
                />
              </DevBlockLabel>
            </div>
            <div className={cn("h-full", isCategoryBlocked && "pointer-events-none opacity-40")}>
              <DevBlockLabel name="ProductCharacteristicsPanel" enabled={dev} stretch>
                <ProductCharacteristicsPanel
                  rows={infoRows}
                  metaRows={metaRows}
                  layoutEditMode={editingLayout}
                  characteristics={form.characteristics}
                  onCharacteristicChange={handleCharacteristicChange}
                  careInstructions={careInstructions}
                  fabricTypes={fabricTypes}
                  materials={materials}
                  materialComposition={form.materialComposition}
                  onMaterialCompositionChange={handleMaterialCompositionChange}
                  tagsKey={tagsKey}
                  tags={form.tags}
                  onTagsChange={(value) => setField("tags", value)}
                />
              </DevBlockLabel>
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-4 lg:grid-cols-[62fr_35fr]",
              isCategoryBlocked && "pointer-events-none opacity-40"
            )}
          >
            <div className="h-full">
              <DevBlockLabel name="ProductSkuSection" enabled={dev} stretch>
                <ProductSkuSection
                  productId={product.id}
                  colorOptions={colorOptions}
                  sizeOptions={sizeOptions}
                  matrix={skuMatrix}
                />
              </DevBlockLabel>
            </div>
            <DevBlockLabel name="SKUDetail" enabled={dev} stretch>
              <SKUDetail
                // key — на перемиканні SKU локальний стан редагування коду/
                // штрихкоду скидається чисто (remount), без ручної синхронізації
                key={activeSkuDetail?.id ?? "empty"}
                sku={activeSkuDetail}
                productId={product.id}
                onBarcodeSaved={skuMatrix.setSkuBarcode}
                pricing={{
                  purchasePrice: pricing.purchasePrice,
                  retail: retailAmount,
                  oldPrice: pricing.oldPrice,
                  wholesale: wholesaleAmount,
                  dropship: dropshipAmount,
                  retailDiscount: retailDiscountAmount,
                }}
                sameForAllSizes={pricing.sameForAllSizes}
              />
            </DevBlockLabel>
          </div>
        </div>
      </DndContext>
    </>
  );
}
