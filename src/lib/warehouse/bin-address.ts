// Чиста логіка адресації комірок складу (WarehouseBinLocationsTab) — без
// залежності від БД/React, щоб один і той самий код рахував і клієнтський
// «Попередній перегляд» (перші N адрес), і реальну генерацію на сервері
// (server/data/warehouse-bin-locations.ts) — не дублювати формулу двічі.

export type BinSeparator = "space" | "dash" | "slash" | "none";

export const BIN_SEPARATOR_CHARS: Record<BinSeparator, string> = {
  space: " ",
  dash: "-",
  slash: "/",
  none: "",
};

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

export function composeBinCode(
  level1: string,
  level2: string,
  level3: string,
  separator: BinSeparator
): string {
  return [level1, level2, level3].join(BIN_SEPARATOR_CHARS[separator]);
}

export interface BinGeneratorParams {
  level1Format: string;
  level2Format: string;
  level3Format: string;
  separator: BinSeparator;
  streetsCount: number;
  racksPerStreet: number;
  cellsPerRack: number;
}

export interface GeneratedBin {
  level1: string;
  level2: string;
  level3: string;
  code: string;
}

export function binGeneratorTotal(params: Pick<BinGeneratorParams, "streetsCount" | "racksPerStreet" | "cellsPerRack">): number {
  const { streetsCount, racksPerStreet, cellsPerRack } = params;
  if (streetsCount <= 0 || racksPerStreet <= 0 || cellsPerRack <= 0) return 0;
  return streetsCount * racksPerStreet * cellsPerRack;
}

/**
 * `limit` — для клієнтського превью (лише перші кілька рядків, не всі
 * потенційно тисячі комбінацій); реальна генерація на сервері викликає без
 * ліміту (Infinity за замовчуванням).
 */
export function generateBinCombinations(
  params: BinGeneratorParams,
  limit: number = Infinity
): GeneratedBin[] {
  const streets = generateLevelSequence(params.level1Format, params.streetsCount);
  const racks = generateLevelSequence(params.level2Format, params.racksPerStreet);
  const cells = generateLevelSequence(params.level3Format, params.cellsPerRack);

  const result: GeneratedBin[] = [];
  outer: for (const s of streets) {
    for (const r of racks) {
      for (const c of cells) {
        if (result.length >= limit) break outer;
        result.push({ level1: s, level2: r, level3: c, code: composeBinCode(s, r, c, params.separator) });
      }
    }
  }
  return result;
}
