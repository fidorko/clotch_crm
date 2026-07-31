import { and, asc, count, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { careInstructions } from "@/server/db/schema";

export type CareInstructionRow = typeof careInstructions.$inferSelect;

export interface CareInstructionInput {
  name: string;
  icon: string;
}

export async function listCareInstructions(tenantId: string): Promise<CareInstructionRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(careInstructions)
      .where(eq(careInstructions.tenantId, tenantId))
      .orderBy(asc(careInstructions.position), asc(careInstructions.createdAt))
  );
}

function friendlyDuplicateNameError(error: unknown): never {
  const pgCode =
    error instanceof Error && error.cause instanceof Error && "code" in error.cause
      ? (error.cause as { code?: string }).code
      : undefined;
  if (pgCode === "23505") {
    throw new Error("Інструкція з такою назвою вже існує");
  }
  throw error;
}

export async function createCareInstruction(
  tenantId: string,
  input: CareInstructionInput
): Promise<CareInstructionRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(careInstructions)
        .where(eq(careInstructions.tenantId, tenantId));
      const [row] = await tx
        .insert(careInstructions)
        .values({ tenantId, name: input.name, icon: input.icon, position: total })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function updateCareInstruction(
  tenantId: string,
  id: string,
  input: CareInstructionInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(careInstructions)
        .set({ name: input.name, icon: input.icon })
        .where(and(eq(careInstructions.tenantId, tenantId), eq(careInstructions.id, id)));
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function deleteCareInstruction(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(careInstructions).where(and(eq(careInstructions.tenantId, tenantId), eq(careInstructions.id, id)));
  });
}
