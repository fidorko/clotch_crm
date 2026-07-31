import { and, asc, count, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { sizeTypes, sizeValues } from "@/server/db/schema";

export type SizeTypeRow = typeof sizeTypes.$inferSelect;
export type SizeValueRow = typeof sizeValues.$inferSelect;

export interface SizeTypeWithValues extends SizeTypeRow {
  values: SizeValueRow[];
}

function dedupeValues(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function friendlyDuplicateNameError(error: unknown): never {
  const pgCode =
    error instanceof Error && error.cause instanceof Error && "code" in error.cause
      ? (error.cause as { code?: string }).code
      : undefined;
  if (pgCode === "23505") {
    throw new Error("Тип розміру з такою назвою вже існує");
  }
  throw error;
}

/** Усі типи розмірів тенанта разом зі значеннями — для попапу «Розміри та заміри», один батч (не N+1). */
export async function listSizeTypesWithValues(tenantId: string): Promise<SizeTypeWithValues[]> {
  return withTenant(tenantId, async (tx) => {
    const typeRows = await tx
      .select()
      .from(sizeTypes)
      .where(eq(sizeTypes.tenantId, tenantId))
      .orderBy(asc(sizeTypes.position), asc(sizeTypes.createdAt));
    const valueRows = await tx
      .select()
      .from(sizeValues)
      .where(eq(sizeValues.tenantId, tenantId))
      .orderBy(asc(sizeValues.position), asc(sizeValues.createdAt));
    return typeRows.map((type) => ({
      ...type,
      values: valueRows.filter((v) => v.sizeTypeId === type.id),
    }));
  });
}

export async function createSizeType(
  tenantId: string,
  input: { name: string; values: string[] }
): Promise<SizeTypeWithValues> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [{ total }] = await tx.select({ total: count() }).from(sizeTypes).where(eq(sizeTypes.tenantId, tenantId));
      const [type] = await tx.insert(sizeTypes).values({ tenantId, name: input.name, position: total }).returning();
      const uniqueValues = dedupeValues(input.values);
      const values =
        uniqueValues.length === 0
          ? []
          : await tx
              .insert(sizeValues)
              .values(uniqueValues.map((value, index) => ({ tenantId, sizeTypeId: type.id, value, position: index })))
              .returning();
      return { ...type, values };
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

/** Оновлює назву типу й переносить набір значень delete-then-insert (нічого зовнішнього не посилається на id значення). */
export async function updateSizeType(
  tenantId: string,
  id: string,
  input: { name: string; values: string[] }
): Promise<SizeTypeWithValues> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [type] = await tx
        .update(sizeTypes)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(sizeTypes.tenantId, tenantId), eq(sizeTypes.id, id)))
        .returning();
      await tx.delete(sizeValues).where(and(eq(sizeValues.tenantId, tenantId), eq(sizeValues.sizeTypeId, id)));
      const uniqueValues = dedupeValues(input.values);
      const values =
        uniqueValues.length === 0
          ? []
          : await tx
              .insert(sizeValues)
              .values(uniqueValues.map((value, index) => ({ tenantId, sizeTypeId: id, value, position: index })))
              .returning();
      return { ...type, values };
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function deleteSizeType(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(sizeTypes).where(and(eq(sizeTypes.tenantId, tenantId), eq(sizeTypes.id, id)));
  });
}
