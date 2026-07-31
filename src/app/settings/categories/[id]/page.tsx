import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/settings/CategoryForm";
import { getCategoryById, listCategories } from "@/server/data/categories";
import { listAllCategoryPinnedCharacteristics } from "@/server/data/category-characteristics";
import { resolveCategoryPinnedCharacteristics } from "@/lib/categories/characteristic-inheritance";
import { listCustomCharacteristicsWithValues } from "@/server/data/custom-characteristics";
import { listColors } from "@/server/data/colors";
import { listFabricTypesWithDetails } from "@/server/data/fabric-types";
import { listCareInstructions } from "@/server/data/care-instructions";
import { listSizeTypesWithValues } from "@/server/data/size-types";
import { listMeasurementTypesWithValues } from "@/server/data/measurement-types";
import { listReferenceItemsForKinds } from "@/server/data/reference-items";
import { listSuppliers } from "@/server/data/suppliers";
import { buildCategoryCharacteristicOptions } from "@/lib/categories/characteristic-options";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategoryById(getDevTenantId(), id);
  return { title: category?.name ?? "Категорію не знайдено" };
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = getDevTenantId();
  const [
    category,
    categories,
    customCharacteristics,
    colors,
    fabricTypes,
    careInstructions,
    sizeTypes,
    measurementTypes,
    referenceItemsByKind,
    suppliers,
    pinnedByCategory,
  ] = await Promise.all([
    getCategoryById(tenantId, id),
    listCategories(tenantId),
    listCustomCharacteristicsWithValues(tenantId),
    listColors(tenantId),
    listFabricTypesWithDetails(tenantId),
    listCareInstructions(tenantId),
    listSizeTypesWithValues(tenantId),
    listMeasurementTypesWithValues(tenantId),
    listReferenceItemsForKinds(tenantId, ["manufacturers", "countries"]),
    listSuppliers(tenantId),
    listAllCategoryPinnedCharacteristics(tenantId),
  ]);

  if (!category) notFound();
  const dev = DEV_BLOCK_LABELS.settings;

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

  const pinnedKeys = resolveCategoryPinnedCharacteristics(categories, pinnedByCategory, id);

  return (
    <DevBlockLabel name="CategoryForm" enabled={dev}>
      <CategoryForm
        category={category}
        allCategories={categories}
        characteristics={{ options: characteristicOptions, pinnedKeys }}
      />
    </DevBlockLabel>
  );
}
