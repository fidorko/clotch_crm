import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProductHeader } from "@/components/products/ProductHeader";
import { ProductEditorProvider } from "@/components/products/ProductEditorContext";
import { ProductTabs } from "@/components/products/ProductTabs";
import { ProductGeneralTab } from "@/components/products/ProductGeneralTab";
import { ProductSizeChart } from "@/components/products/ProductSizeChart";
import { ProductMeasurements } from "@/components/products/ProductMeasurements";
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
              suppliers={suppliers}
              suppliersPinned={suppliersPinned}
              dynamicRows={dynamicRows}
              careInstructions={careInstructions}
              fabricTypes={fabricTypes}
              materials={materials}
              tagsKey={tagsKey}
              packageDefaults={packageDefaults}
              dev={dev}
            />
          </TabsContent>

          <TabsContent value="sizes" className="flex flex-col gap-4 p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
              <DevBlockLabel name="ProductSizeChart" enabled={dev}>
                <ProductSizeChart />
              </DevBlockLabel>
              <DevBlockLabel name="ProductMeasurements" enabled={dev}>
                <ProductMeasurements measurements={product.measurements} />
              </DevBlockLabel>
            </div>
          </TabsContent>
        </Tabs>
      </ProductEditorProvider>
    </div>
  );
}
