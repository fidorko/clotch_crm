import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { colors } from "@/server/db/schema";

export type ColorRow = typeof colors.$inferSelect;

export interface ColorInput {
  name: string;
  hex: string;
}

/** tenantId — обов'язковий типізований параметр (розділ 6 CLAUDE.md), як у server/data/categories.ts. */
export async function listColors(tenantId: string): Promise<ColorRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(colors)
      .where(eq(colors.tenantId, tenantId))
      .orderBy(asc(colors.position), asc(colors.createdAt))
  );
}

/** Ловить UNIQUE(tenant_id, name) (код 23505) — дружній текст замість сирої помилки Postgres (conventions.md). */
function friendlyDuplicateNameError(error: unknown): never {
  const pgCode =
    error instanceof Error && error.cause instanceof Error && "code" in error.cause
      ? (error.cause as { code?: string }).code
      : undefined;
  if (pgCode === "23505") {
    throw new Error("Колір з такою назвою вже існує");
  }
  throw error;
}

export async function createColor(tenantId: string, input: ColorInput): Promise<ColorRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [row] = await tx
        .insert(colors)
        .values({ tenantId, name: input.name, hex: input.hex })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function updateColor(tenantId: string, id: string, input: ColorInput): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(colors)
        .set({ name: input.name, hex: input.hex, updatedAt: new Date() })
        .where(and(eq(colors.tenantId, tenantId), eq(colors.id, id)));
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function deleteColor(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(colors).where(and(eq(colors.tenantId, tenantId), eq(colors.id, id)));
  });
}
