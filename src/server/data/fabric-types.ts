import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import {
  fabricTypeCareInstructions,
  fabricTypeComposition,
  fabricTypePossibleMaterials,
  fabricTypeSeasons,
  fabricTypes,
  materials,
} from "@/server/db/schema";

export type FabricTypeRow = typeof fabricTypes.$inferSelect;
export type FabricStretch = "low" | "medium" | "high";
export type FabricSeason = "spring" | "summer" | "autumn" | "winter";

export interface FabricTypeCompositionInput {
  materialId: string;
  percent: number;
}

export interface FabricTypeInput {
  name: string;
  description: string | null;
  density: string | null;
  stretch: FabricStretch | null;
  recommendedUse: string | null;
  schemaImageUrl: string | null;
  schemaNotes: string | null;
  isActive: boolean;
  seasons: FabricSeason[];
  composition: FabricTypeCompositionInput[];
  possibleMaterialIds: string[];
  careInstructionIds: string[];
}

export interface FabricTypeDetail extends FabricTypeRow {
  seasons: FabricSeason[];
  composition: { materialId: string; name: string; color: string | null; percent: number }[];
  possibleMaterialIds: string[];
  careInstructionIds: string[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

function friendlyDuplicateError(error: unknown): never {
  if (pgErrorCode(error) === "23505") {
    throw new Error("Тип тканини з такою назвою вже існує");
  }
  throw error;
}

// Спрощена транслітерація укр. кирилиці в латиницю для коду типу тканини
// (напр. "Футер 3-нитка" → "futer-3-nitka") — не офіційний стандарт
// транслітерації, лише читабельний URL-безпечний код, унікальність
// забезпечує генератор нижче (ретрай із суфіксом), а не сама функція.
const TRANSLIT_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
};

function slugify(name: string): string {
  const transliterated = name
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT_MAP[ch] ?? ch)
    .join("");
  const slug = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "tip-tkanyny";
}

async function generateUniqueCode(tx: Tx, tenantId: string, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const existing = await tx
      .select({ id: fabricTypes.id })
      .from(fabricTypes)
      .where(and(eq(fabricTypes.tenantId, tenantId), eq(fabricTypes.code, candidate)))
      .limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function syncChildren(tx: Tx, tenantId: string, fabricTypeId: string, input: FabricTypeInput): Promise<void> {
  await tx.delete(fabricTypeComposition).where(eq(fabricTypeComposition.fabricTypeId, fabricTypeId));
  await tx.delete(fabricTypePossibleMaterials).where(eq(fabricTypePossibleMaterials.fabricTypeId, fabricTypeId));
  await tx.delete(fabricTypeSeasons).where(eq(fabricTypeSeasons.fabricTypeId, fabricTypeId));
  await tx.delete(fabricTypeCareInstructions).where(eq(fabricTypeCareInstructions.fabricTypeId, fabricTypeId));

  if (input.composition.length > 0) {
    await tx.insert(fabricTypeComposition).values(
      input.composition.map((item, index) => ({
        tenantId,
        fabricTypeId,
        materialId: item.materialId,
        percent: item.percent,
        position: index,
      }))
    );
  }
  if (input.possibleMaterialIds.length > 0) {
    await tx.insert(fabricTypePossibleMaterials).values(
      input.possibleMaterialIds.map((materialId) => ({ tenantId, fabricTypeId, materialId }))
    );
  }
  if (input.seasons.length > 0) {
    await tx.insert(fabricTypeSeasons).values(
      input.seasons.map((season) => ({ tenantId, fabricTypeId, season }))
    );
  }
  if (input.careInstructionIds.length > 0) {
    await tx.insert(fabricTypeCareInstructions).values(
      input.careInstructionIds.map((careInstructionId) => ({ tenantId, fabricTypeId, careInstructionId }))
    );
  }
}

/**
 * Усі типи тканини тенанта одразу з повними деталями (склад/можливі матеріали/
 * сезони/догляд) — один запит на кожну дочірню таблицю (4 запити разом, не
 * N+1 у циклі), а не окремий запит на вибір у списку. Обсяг даних тенанта тут
 * малий (довідник, не товари), тож простіше й швидше віддати все клієнту одразу,
 * ніж рефетчити деталі при кожному виборі рядка в списку (немає client-side
 * data-fetching бібліотеки в проєкті, лише Server Actions + router.refresh()).
 */
export async function listFabricTypesWithDetails(tenantId: string): Promise<FabricTypeDetail[]> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select()
      .from(fabricTypes)
      .where(eq(fabricTypes.tenantId, tenantId))
      .orderBy(asc(fabricTypes.position), asc(fabricTypes.createdAt));

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const [compositionRows, possibleRows, seasonRows, careRows] = await Promise.all([
      tx
        .select({
          fabricTypeId: fabricTypeComposition.fabricTypeId,
          materialId: fabricTypeComposition.materialId,
          name: materials.name,
          color: materials.color,
          percent: fabricTypeComposition.percent,
        })
        .from(fabricTypeComposition)
        .innerJoin(materials, eq(fabricTypeComposition.materialId, materials.id))
        .where(and(eq(fabricTypeComposition.tenantId, tenantId), inArray(fabricTypeComposition.fabricTypeId, ids)))
        .orderBy(asc(fabricTypeComposition.position)),
      tx
        .select({ fabricTypeId: fabricTypePossibleMaterials.fabricTypeId, materialId: fabricTypePossibleMaterials.materialId })
        .from(fabricTypePossibleMaterials)
        .where(and(eq(fabricTypePossibleMaterials.tenantId, tenantId), inArray(fabricTypePossibleMaterials.fabricTypeId, ids))),
      tx
        .select({ fabricTypeId: fabricTypeSeasons.fabricTypeId, season: fabricTypeSeasons.season })
        .from(fabricTypeSeasons)
        .where(and(eq(fabricTypeSeasons.tenantId, tenantId), inArray(fabricTypeSeasons.fabricTypeId, ids))),
      tx
        .select({ fabricTypeId: fabricTypeCareInstructions.fabricTypeId, careInstructionId: fabricTypeCareInstructions.careInstructionId })
        .from(fabricTypeCareInstructions)
        .where(and(eq(fabricTypeCareInstructions.tenantId, tenantId), inArray(fabricTypeCareInstructions.fabricTypeId, ids))),
    ]);

    const compositionByType = new Map<string, FabricTypeDetail["composition"]>();
    for (const c of compositionRows) {
      const list = compositionByType.get(c.fabricTypeId) ?? [];
      list.push({ materialId: c.materialId, name: c.name, color: c.color, percent: c.percent });
      compositionByType.set(c.fabricTypeId, list);
    }
    const possibleByType = new Map<string, string[]>();
    for (const p of possibleRows) {
      const list = possibleByType.get(p.fabricTypeId) ?? [];
      list.push(p.materialId);
      possibleByType.set(p.fabricTypeId, list);
    }
    const seasonsByType = new Map<string, FabricSeason[]>();
    for (const s of seasonRows) {
      const list = seasonsByType.get(s.fabricTypeId) ?? [];
      list.push(s.season);
      seasonsByType.set(s.fabricTypeId, list);
    }
    const careByType = new Map<string, string[]>();
    for (const c of careRows) {
      const list = careByType.get(c.fabricTypeId) ?? [];
      list.push(c.careInstructionId);
      careByType.set(c.fabricTypeId, list);
    }

    return rows.map((row) => ({
      ...row,
      composition: compositionByType.get(row.id) ?? [],
      possibleMaterialIds: possibleByType.get(row.id) ?? [],
      seasons: seasonsByType.get(row.id) ?? [],
      careInstructionIds: careByType.get(row.id) ?? [],
    }));
  });
}

export async function createFabricType(tenantId: string, input: FabricTypeInput): Promise<FabricTypeDetail> {
  return withTenant(tenantId, async (tx) => {
    const code = await generateUniqueCode(tx, tenantId, input.name);
    const [{ total }] = await tx
      .select({ total: count() })
      .from(fabricTypes)
      .where(eq(fabricTypes.tenantId, tenantId));

    let row: FabricTypeRow;
    try {
      [row] = await tx
        .insert(fabricTypes)
        .values({
          tenantId,
          name: input.name,
          code,
          description: input.description,
          density: input.density,
          stretch: input.stretch,
          recommendedUse: input.recommendedUse,
          schemaImageUrl: input.schemaImageUrl,
          schemaNotes: input.schemaNotes,
          isActive: input.isActive,
          position: total,
        })
        .returning();
    } catch (error) {
      friendlyDuplicateError(error);
    }

    await syncChildren(tx, tenantId, row.id, input);

    return {
      ...row,
      composition: [],
      possibleMaterialIds: input.possibleMaterialIds,
      seasons: input.seasons,
      careInstructionIds: input.careInstructionIds,
    };
  });
}

export async function updateFabricType(tenantId: string, id: string, input: FabricTypeInput): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(fabricTypes)
        .set({
          name: input.name,
          description: input.description,
          density: input.density,
          stretch: input.stretch,
          recommendedUse: input.recommendedUse,
          schemaImageUrl: input.schemaImageUrl,
          schemaNotes: input.schemaNotes,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(fabricTypes.tenantId, tenantId), eq(fabricTypes.id, id)));
    } catch (error) {
      friendlyDuplicateError(error);
    }

    await syncChildren(tx, tenantId, id, input);
  });
}

export async function deleteFabricType(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(fabricTypes).where(and(eq(fabricTypes.tenantId, tenantId), eq(fabricTypes.id, id)));
  });
}
