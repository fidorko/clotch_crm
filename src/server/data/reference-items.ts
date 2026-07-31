import { and, asc, count, eq, inArray } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { referenceItems } from "@/server/db/schema";
import type { ReferenceItemKind } from "@/lib/constants/reference-item-kinds";

export type ReferenceItemRow = typeof referenceItems.$inferSelect;

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

export async function listReferenceItems(
  tenantId: string,
  kind: ReferenceItemKind
): Promise<ReferenceItemRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(referenceItems)
      .where(and(eq(referenceItems.tenantId, tenantId), eq(referenceItems.kind, kind)))
      .orderBy(asc(referenceItems.position))
  );
}

/**
 * Прев'ю-значення для плиток «Довідники» по всіх kind одразу — один запит,
 * не 9 (правило 7 CLAUDE.md, N+1 у циклі — помилка).
 */
export async function listReferenceItemsForKinds(
  tenantId: string,
  kinds: readonly ReferenceItemKind[]
): Promise<Record<string, ReferenceItemRow[]>> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select()
      .from(referenceItems)
      .where(and(eq(referenceItems.tenantId, tenantId), inArray(referenceItems.kind, kinds)))
      .orderBy(asc(referenceItems.position));

    const result: Record<string, ReferenceItemRow[]> = {};
    for (const row of rows) {
      const list = result[row.kind] ?? [];
      list.push(row);
      result[row.kind] = list;
    }
    return result;
  });
}

export async function createReferenceItem(
  tenantId: string,
  kind: ReferenceItemKind,
  name: string
): Promise<ReferenceItemRow> {
  return withTenant(tenantId, async (tx) => {
    const [{ total }] = await tx
      .select({ total: count() })
      .from(referenceItems)
      .where(and(eq(referenceItems.tenantId, tenantId), eq(referenceItems.kind, kind)));
    try {
      const [row] = await tx
        .insert(referenceItems)
        .values({ tenantId, kind, name, position: total })
        .returning();
      return row;
    } catch (error) {
      if (pgErrorCode(error) === "23505") throw new Error("Таке значення вже є в цьому довіднику");
      throw error;
    }
  });
}

export async function updateReferenceItem(tenantId: string, id: string, name: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(referenceItems)
        .set({ name })
        .where(and(eq(referenceItems.tenantId, tenantId), eq(referenceItems.id, id)));
    } catch (error) {
      if (pgErrorCode(error) === "23505") throw new Error("Таке значення вже є в цьому довіднику");
      throw error;
    }
  });
}

export async function deleteReferenceItem(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(referenceItems)
      .where(and(eq(referenceItems.tenantId, tenantId), eq(referenceItems.id, id)));
  });
}
