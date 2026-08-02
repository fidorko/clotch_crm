import type { CategoryCharacteristicOption } from "@/lib/categories/characteristic-options";
import type { CharacteristicLayoutEntry, CharacteristicPanel } from "@/server/data/product-characteristic-layout";

// Кольори/Постачальники мають власний UI (SKU-конструктор, панель метаданих)
// незалежно від закріплення за категорією — виключені з динамічної секції
// характеристик (узгоджено з людиною). Розміри/Заміри — своя вкладка «Розміри
// та заміри» (окрема задача, не робимо тут), теж виключені.
function isDynamicCharacteristicKey(key: string): boolean {
  if (key === "colors" || key === "suppliers") return false;
  if (key.startsWith("size-type:") || key.startsWith("measurement-type:")) return false;
  return true;
}

export interface ResolvedCharacteristicRow {
  key: string;
  option: CategoryCharacteristicOption;
  panel: CharacteristicPanel;
  position: number;
}

/**
 * Динамічні характеристики картки товару: закріплені за категорією (мінус
 * Кольори/Постачальники/Розміри/Заміри), розподілені по панелях за
 * тенант-рівневим layout. Характеристика без власного рядка в layout —
 * дефолтна панель: `defaultMetaKeys` (Виробники/Країна бренду/Країна
 * виготовлення/Теги — узгоджено з людиною, ці поля традиційно жили в
 * ProductMetaPanel, тепер той самий вміст у ProductPhotoGallery) → "meta",
 * решта → "info"; завжди в кінці списку (той самий
 * принцип "нема рядка = дефолт", що category_characteristics). Людина може
 * перетягнути будь-яку характеристику в іншу панель — тоді власний рядок у
 * `product_characteristic_layout` перекриває цей дефолт назавжди.
 */
export function resolveProductCharacteristicRows(
  pinnedKeys: string[],
  options: CategoryCharacteristicOption[],
  layout: CharacteristicLayoutEntry[],
  defaultMetaKeys: ReadonlySet<string> = new Set()
): { info: ResolvedCharacteristicRow[]; meta: ResolvedCharacteristicRow[] } {
  const layoutByKey = new Map(layout.map((entry) => [entry.characteristicKey, entry]));
  const optionByKey = new Map(options.map((option) => [option.key, option]));

  const rows: ResolvedCharacteristicRow[] = [];
  let nextFallbackPosition = 1000;

  for (const key of pinnedKeys) {
    if (!isDynamicCharacteristicKey(key)) continue;
    const option = optionByKey.get(key);
    if (!option) continue;
    const layoutEntry = layoutByKey.get(key);
    rows.push({
      key,
      option,
      panel: layoutEntry?.panel ?? (defaultMetaKeys.has(key) ? "meta" : "info"),
      position: layoutEntry?.position ?? nextFallbackPosition++,
    });
  }

  return {
    info: rows.filter((row) => row.panel === "info").sort((a, b) => a.position - b.position),
    meta: rows.filter((row) => row.panel === "meta").sort((a, b) => a.position - b.position),
  };
}
