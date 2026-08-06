import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { paymentStatuses } from "@/server/db/schema";

export type PaymentStatusRow = typeof paymentStatuses.$inferSelect;

export interface PaymentStatusInput {
  name: string;
  color: string;
}

/** tenantId — обов'язковий типізований параметр (розділ 6 CLAUDE.md), як у server/data/order-statuses.ts. */
export async function listPaymentStatuses(tenantId: string): Promise<PaymentStatusRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(paymentStatuses)
      .where(eq(paymentStatuses.tenantId, tenantId))
      .orderBy(asc(paymentStatuses.position), asc(paymentStatuses.createdAt))
  );
}

/** Ловить UNIQUE(tenant_id, name) (код 23505) — дружній текст замість сирої помилки Postgres (conventions.md). */
function friendlyDuplicateNameError(error: unknown): never {
  const pgCode =
    error instanceof Error && error.cause instanceof Error && "code" in error.cause
      ? (error.cause as { code?: string }).code
      : undefined;
  if (pgCode === "23505") {
    throw new Error("Статус з такою назвою вже існує");
  }
  throw error;
}

export async function createPaymentStatus(tenantId: string, input: PaymentStatusInput): Promise<PaymentStatusRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [row] = await tx
        .insert(paymentStatuses)
        .values({ tenantId, ...input })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function updatePaymentStatus(
  tenantId: string,
  id: string,
  input: PaymentStatusInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(paymentStatuses)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(paymentStatuses.tenantId, tenantId), eq(paymentStatuses.id, id)));
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function deletePaymentStatus(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(paymentStatuses).where(and(eq(paymentStatuses.tenantId, tenantId), eq(paymentStatuses.id, id)));
  });
}
