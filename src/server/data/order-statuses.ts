import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { orderStatuses } from "@/server/db/schema";

export type OrderStatusRow = typeof orderStatuses.$inferSelect;

export interface OrderStatusInput {
  name: string;
  color: string;
  notifyAfterHours: number | null;
  notifyUser: string | null;
}

/** tenantId — обов'язковий типізований параметр (розділ 6 CLAUDE.md), як у server/data/colors.ts. */
export async function listOrderStatuses(tenantId: string): Promise<OrderStatusRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(orderStatuses)
      .where(eq(orderStatuses.tenantId, tenantId))
      .orderBy(asc(orderStatuses.position), asc(orderStatuses.createdAt))
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

export async function createOrderStatus(tenantId: string, input: OrderStatusInput): Promise<OrderStatusRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [row] = await tx
        .insert(orderStatuses)
        .values({ tenantId, ...input })
        .returning();
      return row;
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function updateOrderStatus(
  tenantId: string,
  id: string,
  input: OrderStatusInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(orderStatuses)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(orderStatuses.tenantId, tenantId), eq(orderStatuses.id, id)));
    } catch (error) {
      friendlyDuplicateNameError(error);
    }
  });
}

export async function deleteOrderStatus(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(orderStatuses).where(and(eq(orderStatuses.tenantId, tenantId), eq(orderStatuses.id, id)));
  });
}
