import type { CustomCharacteristicWithValues } from "@/server/data/custom-characteristics";
import type { ColorRow } from "@/server/data/colors";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { SizeTypeWithValues } from "@/server/data/size-types";
import type { MeasurementTypeWithValues } from "@/server/data/measurement-types";
import type { ReferenceItemRow } from "@/server/data/reference-items";
import type { SupplierRow } from "@/server/data/suppliers";

export interface CategoryCharacteristicOption {
  key: string;
  section: "Характеристики товару" | "Розміри" | "Заміри" | "Системні";
  label: string;
  values: { id: string; label: string }[];
}

export interface CategoryCharacteristicsSourceData {
  customCharacteristics: CustomCharacteristicWithValues[];
  colors: ColorRow[];
  fabricTypes: FabricTypeDetail[];
  careInstructions: CareInstructionRow[];
  sizeTypes: SizeTypeWithValues[];
  measurementTypes: MeasurementTypeWithValues[];
  manufacturers: ReferenceItemRow[];
  countries: ReferenceItemRow[];
  suppliers: SupplierRow[];
}

/**
 * Нормалізує 9 різних джерел довідників (кожне своєї форми) в один плаский
 * список "характеристика -> список значень" для картки "Закріплення
 * характеристик" на сторінці категорії. Список тягнеться зі свіжих даних БД
 * при кожному рендері сторінки — нові користувацькі характеристики й нові
 * значення довідників з'являються тут самі, без окремої синхронізації.
 */
export function buildCategoryCharacteristicOptions(
  data: CategoryCharacteristicsSourceData
): CategoryCharacteristicOption[] {
  const options: CategoryCharacteristicOption[] = [
    {
      key: "colors",
      section: "Характеристики товару",
      label: "Кольори",
      values: data.colors.map((c) => ({ id: c.id, label: c.name })),
    },
    {
      key: "fabric-materials",
      section: "Характеристики товару",
      label: "Тип тканини",
      values: data.fabricTypes.map((f) => ({ id: f.id, label: f.name })),
    },
    {
      key: "care-instructions",
      section: "Характеристики товару",
      label: "Інструкція по догляду",
      values: data.careInstructions.map((c) => ({ id: c.id, label: c.name })),
    },
  ];

  for (const type of data.sizeTypes) {
    options.push({
      key: `size-type:${type.id}`,
      section: "Розміри",
      label: type.name,
      values: type.values.map((v) => ({ id: v.id, label: v.value })),
    });
  }

  for (const type of data.measurementTypes) {
    options.push({
      key: `measurement-type:${type.id}`,
      section: "Заміри",
      label: type.name,
      values: type.values.map((v) => ({ id: v.id, label: v.value })),
    });
  }

  for (const characteristic of data.customCharacteristics) {
    options.push({
      key: `custom:${characteristic.id}`,
      section: "Характеристики товару",
      label: characteristic.name,
      values: characteristic.values.map((v) => ({ id: v.id, label: v.value })),
    });
  }

  options.push(
    {
      key: "reference-item:manufacturers",
      section: "Системні",
      label: "Виробники",
      values: data.manufacturers.map((m) => ({ id: m.id, label: m.name })),
    },
    // Два окремих поля з одного довідника "Країни" (settings → Довідники →
    // Країни) — за прямою вказівкою людини: "Країна бренду" й "Країна
    // виготовлення" незалежні одна від одної на товарі, але обирають зі
    // спільного списку назв країн, не два окремих довідники.
    {
      key: "reference-item:brand-country",
      section: "Системні",
      label: "Країна бренду",
      values: data.countries.map((c) => ({ id: c.id, label: c.name })),
    },
    {
      key: "reference-item:country-of-origin",
      section: "Системні",
      label: "Країна виготовлення",
      values: data.countries.map((c) => ({ id: c.id, label: c.name })),
    },
    {
      key: "suppliers",
      section: "Системні",
      label: "Постачальники",
      values: data.suppliers.map((s) => ({ id: s.id, label: s.name })),
    }
  );

  return options;
}
