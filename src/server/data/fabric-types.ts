import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { fabricTypePossibleMaterials, fabricTypes } from "@/server/db/schema";

export type FabricTypeRow = typeof fabricTypes.$inferSelect;
export type FabricStretch = "low" | "medium" | "high";

export interface FabricTypeInput {
  name: string;
  description: string | null;
  density: string | null;
  stretch: FabricStretch | null;
  frontSide: string | null;
  backSide: string | null;
  tactileFeel: string | null;
  isActive: boolean;
  possibleMaterialIds: string[];
}

export interface FabricTypeDetail extends FabricTypeRow {
  possibleMaterialIds: string[];
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

async function syncPossibleMaterials(
  tx: Tx,
  tenantId: string,
  fabricTypeId: string,
  possibleMaterialIds: string[]
): Promise<void> {
  await tx.delete(fabricTypePossibleMaterials).where(eq(fabricTypePossibleMaterials.fabricTypeId, fabricTypeId));
  if (possibleMaterialIds.length > 0) {
    await tx.insert(fabricTypePossibleMaterials).values(
      possibleMaterialIds.map((materialId) => ({ tenantId, fabricTypeId, materialId }))
    );
  }
}

/**
 * Усі типи тканини тенанта одразу з id можливих матеріалів — один batch-запит
 * на fabric_type_possible_materials (id, не join на materials — компоненти й
 * так отримують повний materials-проп окремо для резолву назви/кольору),
 * не N+1 у циклі. Обсяг тенанта тут малий (довідник, не товари), тож просто
 * віддати все клієнту одразу, без client-side data-fetching бібліотеки в проєкті.
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
    const possibleRows = await tx
      .select({ fabricTypeId: fabricTypePossibleMaterials.fabricTypeId, materialId: fabricTypePossibleMaterials.materialId })
      .from(fabricTypePossibleMaterials)
      .where(and(eq(fabricTypePossibleMaterials.tenantId, tenantId), inArray(fabricTypePossibleMaterials.fabricTypeId, ids)));

    const possibleByType = new Map<string, string[]>();
    for (const p of possibleRows) {
      const list = possibleByType.get(p.fabricTypeId) ?? [];
      list.push(p.materialId);
      possibleByType.set(p.fabricTypeId, list);
    }

    return rows.map((row) => ({
      ...row,
      possibleMaterialIds: possibleByType.get(row.id) ?? [],
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
          frontSide: input.frontSide,
          backSide: input.backSide,
          tactileFeel: input.tactileFeel,
          isActive: input.isActive,
          position: total,
        })
        .returning();
    } catch (error) {
      friendlyDuplicateError(error);
    }

    await syncPossibleMaterials(tx, tenantId, row.id, input.possibleMaterialIds);

    return { ...row, possibleMaterialIds: input.possibleMaterialIds };
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
          frontSide: input.frontSide,
          backSide: input.backSide,
          tactileFeel: input.tactileFeel,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(fabricTypes.tenantId, tenantId), eq(fabricTypes.id, id)));
    } catch (error) {
      friendlyDuplicateError(error);
    }

    await syncPossibleMaterials(tx, tenantId, id, input.possibleMaterialIds);
  });
}

export async function deleteFabricType(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(fabricTypes).where(and(eq(fabricTypes.tenantId, tenantId), eq(fabricTypes.id, id)));
  });
}
