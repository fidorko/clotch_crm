import type { CategoryCharacteristicOption } from "@/lib/categories/characteristic-options";

export function findCharacteristicOption(
  options: CategoryCharacteristicOption[],
  key: string
): CategoryCharacteristicOption | undefined {
  return options.find((option) => option.key === key);
}

/**
 * Знаходить характеристику за відображуваним лейблом — для полів без
 * system_key (Бренд/Колекція тощо, на відміну від "Тегів"), fragile до
 * перейменування людиною так само, як секції в characteristic-options.ts;
 * прийнятний компроміс для некритичних полів (decisions.md).
 */
export function findCharacteristicOptionByLabel(
  options: CategoryCharacteristicOption[],
  label: string
): CategoryCharacteristicOption | undefined {
  return options.find((option) => option.label === label);
}

/** Лейбли обраних значень динамічної характеристики товару, у порядку. */
export function resolveCharacteristicLabels(
  options: CategoryCharacteristicOption[],
  characteristics: Record<string, string[]>,
  key: string
): string[] {
  const ids = characteristics[key] ?? [];
  if (ids.length === 0) return [];
  const option = findCharacteristicOption(options, key);
  if (!option) return [];
  return ids
    .map((id) => option.values.find((value) => value.id === id)?.label)
    .filter((label): label is string => Boolean(label));
}

/** Перше обране значення (для однозначних полів) або "" — для карток/хлібних крихт. */
export function resolveCharacteristicLabel(
  options: CategoryCharacteristicOption[],
  characteristics: Record<string, string[]>,
  key: string
): string {
  return resolveCharacteristicLabels(options, characteristics, key)[0] ?? "";
}
