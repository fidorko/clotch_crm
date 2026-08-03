// Чиста логіка адресації комірок складу (WarehouseBinExplorer) — без
// залежності від БД/React, щоб один і той самий код рахував і клієнтський
// стан, і реальне створення на сервері (server/data/warehouse-bin-locations.ts).

function isNumericFormat(format: string): boolean {
  return /^\d+$/.test(format);
}

/**
 * Формат рівня — це ЗРАЗОК стартового значення, не окремий шаблон:
 * "101" → цифрові адреси від 101, з падінгом нулями до 3 знаків;
 * "01" → від 1, падінг до 2 знаків; "A" → літери A, B, ... Z, AA, AB...
 * (стиль назв колонок Excel), регістр перенімається із зразка.
 */
export function generateLevelSequence(format: string, count: number): string[] {
  const trimmed = format.trim();
  if (count <= 0 || !trimmed) return [];

  if (isNumericFormat(trimmed)) {
    const width = trimmed.length;
    const start = parseInt(trimmed, 10);
    return Array.from({ length: count }, (_, i) => String(start + i).padStart(width, "0"));
  }

  const isLower = trimmed === trimmed.toLowerCase();
  const startIndex = alphaToIndex(trimmed.toUpperCase());
  if (startIndex === null) return [];
  return Array.from({ length: count }, (_, i) => {
    const letters = indexToAlpha(startIndex + i);
    return isLower ? letters.toLowerCase() : letters;
  });
}

function alphaToIndex(letters: string): number | null {
  if (!/^[A-Z]+$/.test(letters)) return null;
  let result = 0;
  for (const ch of letters) {
    result = result * 26 + (ch.charCodeAt(0) - 64);
  }
  return result - 1;
}

function indexToAlpha(index: number): string {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// Роздільник між рівнями адреси — фіксований пробіл (погоджено з людиною,
// налаштування прибрано разом зі "Структура адрес"). "101 A 01".
export function composeBinCode(level1: string, level2: string, level3: string): string {
  return [level1, level2, level3].join(" ");
}

/**
 * Наступні `count` вільних значень рівня за форматом, які ще не зайняті
 * серед `existingValues` (вулиці складу / стелажі конкретної вулиці / комірки
 * конкретного стелажа — залежно від рівня виклику). Не покладається на
 * "старт = кількість наявних": після видалення значення "в середині"
 * послідовності (напр. стелаж 102 з наявних 101/102/103) наївний підрахунок
 * за довжиною видав би вже зайняте значення повторно — тут справді фільтрує
 * зайняті й розширює вікно пошуку, поки не набереться потрібна кількість.
 * Так само коректно працює, якщо серед existingValues є довільні значення,
 * введені вручну (одиничне створення — без формату) — вони просто ніколи не
 * збігаються з кандидатами послідовності.
 */
export function nextSequenceValues(
  format: string,
  existingValues: readonly string[],
  count: number
): string[] {
  if (count <= 0) return [];
  const existing = new Set(existingValues);
  let limit = existing.size + count;
  const maxLimit = (existing.size + count) * 50 + 1000;

  while (limit <= maxLimit) {
    const seq = generateLevelSequence(format, limit);
    const fresh = seq.filter((v) => !existing.has(v));
    if (fresh.length >= count) return fresh.slice(0, count);
    limit *= 2;
  }
  return [];
}
