import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { companyLegalEntities } from "@/server/db/schema";

export type CompanyLegalEntityRow = typeof companyLegalEntities.$inferSelect;
export type CompanyLegalEntityType = CompanyLegalEntityRow["type"];

export interface CompanyLegalEntityInput {
  type: CompanyLegalEntityType;
  name: string;
  edrpou: string;
  isActive: boolean;
}

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

/** Ловить UNIQUE(tenant_id, edrpou) (код 23505) — дружній текст (conventions.md). */
function friendlyDuplicateError(error: unknown): never {
  if (pgErrorCode(error) === "23505") {
    throw new Error("Компанія з таким ЄДРПОУ вже додана");
  }
  throw error;
}

export async function listCompanyLegalEntities(tenantId: string): Promise<CompanyLegalEntityRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(companyLegalEntities)
      .where(eq(companyLegalEntities.tenantId, tenantId))
      .orderBy(asc(companyLegalEntities.position), asc(companyLegalEntities.createdAt))
  );
}

export async function createCompanyLegalEntity(
  tenantId: string,
  input: CompanyLegalEntityInput
): Promise<CompanyLegalEntityRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [row] = await tx
        .insert(companyLegalEntities)
        .values({ tenantId, ...input })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function updateCompanyLegalEntity(
  tenantId: string,
  id: string,
  input: CompanyLegalEntityInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(companyLegalEntities)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(companyLegalEntities.tenantId, tenantId), eq(companyLegalEntities.id, id)));
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function deleteCompanyLegalEntity(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(companyLegalEntities)
      .where(and(eq(companyLegalEntities.tenantId, tenantId), eq(companyLegalEntities.id, id)));
  });
}
