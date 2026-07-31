import { and, asc, count, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { measurementTypes, measurementValues } from "@/server/db/schema";

export type MeasurementTypeRow = typeof measurementTypes.$inferSelect;
export type MeasurementValueRow = typeof measurementValues.$inferSelect;

export interface MeasurementTypeWithValues extends MeasurementTypeRow {
  values: MeasurementValueRow[];
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
    throw new Error("Тип заміру з такою назвою вже існує");
  }
  throw error;
}

/** Усі типи замірів тенанта разом зі значеннями — для попапу «Розміри та заміри», один батч (не N+1). */
export async function listMeasurementTypesWithValues(tenantId: string): Promise<MeasurementTypeWithValues[]> {
  return withTenant(tenantId, async (tx) => {
    const typeRows = await tx
      .select()
      .from(measurementTypes)
      .where(eq(measurementTypes.tenantId, tenantId))
      .orderBy(asc(measurementTypes.position), asc(measurementTypes.createdAt));
    const valueRows = await tx
      .select()
      .from(measurementValues)
      .where(eq(measurementValues.tenantId, tenantId))
      .orderBy(asc(measurementValues.position), asc(measurementValues.createdAt));
    return typeRows.map((type) => ({
      ...type,
      values: valueRows.filter((v) => v.measurementTypeId === type.id),
    }));
  });
}

export async function createMeasurementType(
  tenantId: string,
  input: { name: string; values: string[] }
): Promise<MeasurementTypeWithValues> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(measurementTypes)
        .where(eq(measurementTypes.tenantId, tenantId));
      const [type] = await tx
        .insert(measurementTypes)
        .values({ tenantId, name: input.name, position: total })
        .returning();
      const uniqueValues = dedupeValues(input.values);
      const values =
        uniqueValues.length === 0
          ? []
          : await tx
              .insert(measurementValues)
              .values(
                uniqueValues.map((value, index) => ({ tenantId, measurementTypeId: type.id, value, position: index }))
              )
              .returning();
      return { ...type, values };
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function updateMeasurementType(
  tenantId: string,
  id: string,
  input: { name: string; values: string[] }
): Promise<MeasurementTypeWithValues> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [type] = await tx
        .update(measurementTypes)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(measurementTypes.tenantId, tenantId), eq(measurementTypes.id, id)))
        .returning();
      await tx
        .delete(measurementValues)
        .where(and(eq(measurementValues.tenantId, tenantId), eq(measurementValues.measurementTypeId, id)));
      const uniqueValues = dedupeValues(input.values);
      const values =
        uniqueValues.length === 0
          ? []
          : await tx
              .insert(measurementValues)
              .values(
                uniqueValues.map((value, index) => ({ tenantId, measurementTypeId: id, value, position: index }))
              )
              .returning();
      return { ...type, values };
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function deleteMeasurementType(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(measurementTypes).where(and(eq(measurementTypes.tenantId, tenantId), eq(measurementTypes.id, id)));
  });
}
