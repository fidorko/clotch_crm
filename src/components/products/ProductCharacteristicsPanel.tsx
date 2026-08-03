"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicCharacteristicsSection } from "@/components/products/characteristics/DynamicCharacteristicsSection";
import type { MaterialCompositionEntry } from "@/components/products/characteristics/MaterialCompositionRow";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";

/**
 * Усі характеристики, закріплені за категорією товару — окремий блок (за прямою
 * вказівкою людини, 2026-08-03; раніше жили двома окремими секціями всередині
 * ProductInfoPanel упереміш із цінами й полями товару).
 *
 * Обидві дропзони тенант-layout-у ("info-panel"/"meta-panel") лишились як були,
 * механізм (drag&drop, таблиця product_characteristic_layout) не змінився —
 * лише візуально тепер одна колонка (четвертий прохід, 2026-08-03: панель стала
 * вужчою — 30% ширини замість половини картки — дві колонки поруч уже тісні),
 * дропзони стоять одна під одною (products-characteristics.md).
 */
export function ProductCharacteristicsPanel({
  rows,
  metaRows,
  layoutEditMode,
  characteristics,
  onCharacteristicChange,
  careInstructions,
  fabricTypes,
  materials,
  materialComposition,
  onMaterialCompositionChange,
  tagsKey,
  tags,
  onTagsChange,
}: {
  rows: ResolvedCharacteristicRow[];
  metaRows: ResolvedCharacteristicRow[];
  layoutEditMode: boolean;
  characteristics: Record<string, string[]>;
  onCharacteristicChange: (key: string, valueIds: string[]) => void;
  careInstructions: CareInstructionRow[];
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  materialComposition: MaterialCompositionEntry[];
  onMaterialCompositionChange: (entries: MaterialCompositionEntry[]) => void;
  tagsKey: string | null;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  const shared = {
    layoutEditMode,
    characteristics,
    onCharacteristicChange,
    careInstructions,
    fabricTypes,
    materials,
    materialComposition,
    onMaterialCompositionChange,
    tagsKey,
    tags,
    onTagsChange,
  };
  const isEmpty = !layoutEditMode && rows.length === 0 && metaRows.length === 0;

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Характеристики</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {isEmpty ? (
          <p className="py-2 text-xs text-muted-foreground">
            За цією категорією не закріплено жодної характеристики. Налаштування → Категорії
            товару → «Закріплення характеристик».
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            <DynamicCharacteristicsSection dropId="info-panel" rows={rows} {...shared} />
            <DynamicCharacteristicsSection dropId="meta-panel" rows={metaRows} {...shared} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
