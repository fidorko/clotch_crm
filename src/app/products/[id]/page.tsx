import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProductHeader } from "@/components/products/ProductHeader";
import { ProductEditorProvider } from "@/components/products/ProductEditorContext";
import { ProductTabs } from "@/components/products/ProductTabs";
import { ProductGeneralTab } from "@/components/products/ProductGeneralTab";
import { ProductTechnicalTab } from "@/components/products/ProductTechnicalTab";
import { ProductSizeChart } from "@/components/products/ProductSizeChart";
import { MeasurementGuide } from "@/components/products/MeasurementGuide";
import { deriveDistinctSizes } from "@/lib/products/sku-sizes";
import { TECHNICAL_FIELD_KEYS, resolveTechnicalFieldOrder } from "@/lib/products/technical-fields";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { getProductById } from "@/server/data/products";
import { listCategories } from "@/server/data/categories";
import { listColors } from "@/server/data/colors";
import { listSuppliers } from "@/server/data/suppliers";
import { listAllCategoryPinnedCharacteristics } from "@/server/data/category-characteristics";
import { resolveCategoryPinnedCharacteristics } from "@/lib/categories/characteristic-inheritance";
import { listCustomCharacteristicsWithValues } from "@/server/data/custom-characteristics";
import { listFabricTypesWithDetails } from "@/server/data/fabric-types";
import { listMaterials } from "@/server/data/materials";
import { listCareInstructions } from "@/server/data/care-instructions";
import { listSizeTypesWithValues } from "@/server/data/size-types";
import { listMeasurementTypesWithValues } from "@/server/data/measurement-types";
import { listReferenceItemsForKinds } from "@/server/data/reference-items";
import { buildCategoryCharacteristicOptions } from "@/lib/categories/characteristic-options";
import { getCharacteristicLayout } from "@/server/data/product-characteristic-layout";
import { getTechnicalFieldLayout } from "@/server/data/product-technical-layout";
import { listProductActivityLog } from "@/server/data/product-activity-log";
import { resolveProductCharacteristicRows } from "@/lib/products/characteristic-layout";
import { resolveInheritedField } from "@/lib/categories/inheritance";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

type PageProps = { params: Promise<{ id: string }> };

// cache() дедуплікує запит між generateMetadata і сторінкою в межах одного рендеру.
const loadProduct = cache((id: string) => getProductById(getDevTenantId(), id));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  return { title: product?.name ?? "Товар не знайдено" };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();
  const dev = DEV_BLOCK_LABELS.products;
  const tenantId = getDevTenantId();

  const [
    categories,
    colors,
    suppliers,
    customCharacteristics,
    fabricTypes,
    materials,
    careInstructions,
    sizeTypes,
    measurementTypes,
    referenceItemsByKind,
    pinnedByCategory,
    layout,
    technicalLayout,
    activityLog,
  ] = await Promise.all([
    listCategories(tenantId),
    listColors(tenantId),
    listSuppliers(tenantId),
    listCustomCharacteristicsWithValues(tenantId),
    listFabricTypesWithDetails(tenantId),
    listMaterials(tenantId),
    listCareInstructions(tenantId),
    listSizeTypesWithValues(tenantId),
    listMeasurementTypesWithValues(tenantId),
    listReferenceItemsForKinds(tenantId, ["manufacturers", "countries"]),
    listAllCategoryPinnedCharacteristics(tenantId),
    getCharacteristicLayout(tenantId),
    getTechnicalFieldLayout(tenantId),
    listProductActivityLog(tenantId, id),
  ]);

  const colorOptions = colors.map((color) => ({ name: color.name, hex: color.hex }));

  // Той самий 9-джерельний набір, що settings/categories/[id] — картка товару
  // тепер читає той самий довідник, за яким категорія закріплює характеристики.
  const characteristicOptions = buildCategoryCharacteristicOptions({
    customCharacteristics,
    colors,
    fabricTypes,
    careInstructions,
    sizeTypes,
    measurementTypes,
    manufacturers: referenceItemsByKind.manufacturers ?? [],
    countries: referenceItemsByKind.countries ?? [],
    suppliers,
  });

  const pinnedKeys = product.categoryId
    ? resolveCategoryPinnedCharacteristics(categories, pinnedByCategory, product.categoryId)
    : [];

  // "Теги" — той самий механізм ідентифікації, що syncProductTags (system_key,
  // не назва) — стабільний навіть якщо людина перейменує характеристику.
  const tagsCharacteristic = customCharacteristics.find((c) => c.systemKey === "tags");
  const tagsKey = tagsCharacteristic ? `custom:${tagsCharacteristic.id}` : null;

  // Виробники/обидві країни/Теги традиційно жили в ProductMetaPanel — дефолтна
  // панель, поки людина не перетягнула вручну (products-characteristics.md).
  const defaultMetaKeys = new Set(
    [
      "reference-item:manufacturers",
      "reference-item:brand-country",
      "reference-item:country-of-origin",
      tagsKey,
    ].filter((key): key is string => key !== null)
  );

  const dynamicRows = resolveProductCharacteristicRows(
    pinnedKeys,
    characteristicOptions,
    layout,
    defaultMetaKeys
  );

  // Кольори/Постачальники/Розміри мають власний UI (SKU-конструктор, панель
  // метаданих) поза динамічною секцією характеристик, але й далі підкоряються
  // закріпленню за категорією — узгоджено з людиною (products-characteristics.md).
  const colorsPinned = pinnedKeys.includes("colors");
  const suppliersPinned = pinnedKeys.includes("suppliers");
  const effectiveColorOptions = colorsPinned ? colorOptions : [];

  // Вкладка «Технічні дані»: "Постачальник" — та сама гейтинг-логіка, що мав
  // ProductMetaPanel раніше — виключений з порядку/показу, коли не закріплений.
  const technicalFieldKeys = suppliersPinned
    ? TECHNICAL_FIELD_KEYS
    : TECHNICAL_FIELD_KEYS.filter((key) => key !== "supplier");
  const technicalFieldOrder = resolveTechnicalFieldOrder(technicalLayout, technicalFieldKeys);

  const pinnedSizeTypeIds = pinnedKeys
    .filter((key) => key.startsWith("size-type:"))
    .map((key) => key.slice("size-type:".length));
  const sizeOptions = [
    ...new Set(
      sizeTypes
        .filter((type) => pinnedSizeTypeIds.includes(type.id))
        .flatMap((type) => type.values.map((v) => v.value))
    ),
  ];

  // Розмірна сітка (ProductSizeChart): рядки — розміри, реально додані в
  // конструкторі SKU; колонки — точки заміру типів, закріплених за категорією
  // (той самий принцип, що sizeOptions вище, лише для measurement-type:*).
  const productSizes = deriveDistinctSizes(product.skus);
  const pinnedMeasurementTypeIds = pinnedKeys
    .filter((key) => key.startsWith("measurement-type:"))
    .map((key) => key.slice("measurement-type:".length));
  const measurementPoints = measurementTypes
    .filter((type) => pinnedMeasurementTypeIds.includes(type.id))
    .flatMap((type) => type.values.map((v) => ({ id: v.id, label: v.value })));

  // Успадкування розмірів/ваги посилки від категорії (walk up parentId, той
  // самий resolveInheritedField, що для самих категорій) — на товарі,
  // products-characteristics.md.
  const packageDefaults = {
    lengthCm: resolveInheritedField(categories, product.categoryId, "defaultLengthCm"),
    widthCm: resolveInheritedField(categories, product.categoryId, "defaultWidthCm"),
    heightCm: resolveInheritedField(categories, product.categoryId, "defaultHeightCm"),
    weightKg: (() => {
      const value = resolveInheritedField(categories, product.categoryId, "defaultWeightKg");
      return value === null ? null : Number(value);
    })(),
  };

  return (
    <div className="flex flex-1 flex-col">
      <ProductEditorProvider product={product} categories={categories}>
        <DevBlockLabel name="ProductHeader" enabled={dev}>
          <ProductHeader
            product={product}
            categories={categories}
            characteristicOptions={characteristicOptions}
          />
        </DevBlockLabel>
        <Tabs defaultValue="general" className="flex flex-1 flex-col">
          <DevBlockLabel name="ProductTabs" enabled={dev}>
            <ProductTabs />
          </DevBlockLabel>

          <TabsContent value="general" className="flex flex-col gap-4 p-6">
            <ProductGeneralTab
              product={product}
              categories={categories}
              colorOptions={effectiveColorOptions}
              sizeOptions={sizeOptions}
              dynamicRows={dynamicRows}
              careInstructions={careInstructions}
              fabricTypes={fabricTypes}
              materials={materials}
              tagsKey={tagsKey}
              dev={dev}
            />
          </TabsContent>

          <TabsContent value="technical" className="flex flex-col gap-4 p-6">
            <DevBlockLabel name="ProductTechnicalTab" enabled={dev}>
              <ProductTechnicalTab
                product={product}
                suppliers={suppliers}
                packageDefaults={packageDefaults}
                initialOrder={technicalFieldOrder}
                activityLog={activityLog}
              />
            </DevBlockLabel>
          </TabsContent>

          <TabsContent value="sizes" className="flex flex-col gap-4 p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
              <DevBlockLabel name="ProductSizeChart" enabled={dev}>
                <ProductSizeChart sizes={productSizes} measurementPoints={measurementPoints} />
              </DevBlockLabel>
              <DevBlockLabel name="MeasurementGuide" enabled={dev}>
                <MeasurementGuide points={measurementPoints} />
              </DevBlockLabel>
            </div>
          </TabsContent>
        </Tabs>
      </ProductEditorProvider>
    </div>
  );
}
