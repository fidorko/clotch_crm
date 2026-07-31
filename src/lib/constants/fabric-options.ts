import type { materialCategoryEnum } from "@/server/db/schema/materials";
import type { FabricStretch } from "@/server/data/fabric-types";

// Розтяжність — pg-enum у схемі, значення задає розробник, не людина через
// попап (decisions.md) — UA-лейбли для UI.
export const FABRIC_STRETCH_OPTIONS: { value: FabricStretch; label: string }[] = [
  { value: "low", label: "Низька" },
  { value: "medium", label: "Середня" },
  { value: "high", label: "Висока" },
];

export function stretchLabel(value: FabricStretch): string {
  return FABRIC_STRETCH_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export type MaterialCategory = (typeof materialCategoryEnum.enumValues)[number];

// Категорії матеріалу — той самий підхід (фіксований pg-enum) — UA-лейбли для
// групування пікера "Можливі матеріали" (FabricTypePossibleMaterialsField).
export const MATERIAL_CATEGORY_OPTIONS: { value: MaterialCategory; label: string }[] = [
  { value: "natural", label: "Натуральні" },
  { value: "cellulose", label: "Штучні (целюлозні)" },
  { value: "synthetic", label: "Синтетичні" },
  { value: "leather", label: "Шкіра" },
  { value: "fur", label: "Хутро" },
  { value: "rubber", label: "Гума та подібні матеріали" },
  { value: "other", label: "Інші" },
];

export function materialCategoryLabel(value: MaterialCategory | null): string {
  return MATERIAL_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? "Інші";
}
