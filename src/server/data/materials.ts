import { and, asc, count, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { materials } from "@/server/db/schema";

export type MaterialRow = typeof materials.$inferSelect;

export interface MaterialInput {
  name: string;
  color: string | null;
}

export async function listMaterials(tenantId: string): Promise<MaterialRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(materials)
      .where(eq(materials.tenantId, tenantId))
      .orderBy(asc(materials.position), asc(materials.createdAt))
  );
}

function friendlyDuplicateNameError(error: unknown): never {
  const pgCode =
    error instanceof Error && error.cause instanceof Error && "code" in error.cause
      ? (error.cause as { code?: string }).code
      : undefined;
  if (pgCode === "23505") {
    throw new Error("Матеріал з такою назвою вже існує");
  }
  throw error;
}

export async function createMaterial(tenantId: string, input: MaterialInput): Promise<MaterialRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(materials)
        .where(eq(materials.tenantId, tenantId));
      const [row] = await tx
        .insert(materials)
        .values({ tenantId, name: input.name, color: input.color, position: total })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function updateMaterial(tenantId: string, id: string, input: MaterialInput): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(materials)
        .set({ name: input.name, color: input.color })
        .where(and(eq(materials.tenantId, tenantId), eq(materials.id, id)));
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function deleteMaterial(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(materials).where(and(eq(materials.tenantId, tenantId), eq(materials.id, id)));
  });
}
