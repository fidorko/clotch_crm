import { and, asc, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { paymentMethods, paymentMethodPartialAmounts } from "@/server/db/schema";

export type PaymentMethodRow = typeof paymentMethods.$inferSelect;
export type PaymentMethodKind = PaymentMethodRow["kind"];
export type PaymentMethodPartialAmountRow = typeof paymentMethodPartialAmounts.$inferSelect;

export interface PaymentMethodInput {
  name: string;
  isEnabled: boolean;
  partialAmounts: string[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

/** Ловить UNIQUE(tenant_id, name) (код 23505) — дружній текст (conventions.md). */
function friendlyDuplicateError(error: unknown): never {
  if (pgErrorCode(error) === "23505") {
    throw new Error("Спосіб оплати з такою назвою вже існує");
  }
  throw error;
}

/** Замінює весь набір варіантів суми часткової оплати — delete-then-insert, той самий прийом, що replaceStatusRules у server/data/delivery-methods.ts. */
async function replacePartialAmounts(
  tx: Tx,
  tenantId: string,
  paymentMethodId: string,
  amounts: string[]
): Promise<void> {
  await tx
    .delete(paymentMethodPartialAmounts)
    .where(
      and(
        eq(paymentMethodPartialAmounts.tenantId, tenantId),
        eq(paymentMethodPartialAmounts.paymentMethodId, paymentMethodId)
      )
    );
  if (amounts.length === 0) return;
  await tx.insert(paymentMethodPartialAmounts).values(
    amounts.map((amount, index) => ({
      tenantId,
      paymentMethodId,
      amount,
      position: index,
    }))
  );
}

export async function listPaymentMethods(tenantId: string): Promise<PaymentMethodRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.tenantId, tenantId))
      .orderBy(asc(paymentMethods.position), asc(paymentMethods.createdAt))
  );
}

/** Усі варіанти суми часткової оплати всіх способів тенанта одним запитом — групується на клієнті за paymentMethodId. */
export async function listAllPaymentMethodPartialAmounts(
  tenantId: string
): Promise<PaymentMethodPartialAmountRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(paymentMethodPartialAmounts)
      .where(eq(paymentMethodPartialAmounts.tenantId, tenantId))
      .orderBy(asc(paymentMethodPartialAmounts.position), asc(paymentMethodPartialAmounts.createdAt))
  );
}

/** Завжди kind="custom" — системні варіанти (bank_transfer/card_online/partial_payment/cash_on_delivery) створює лише db:seed. */
export async function createPaymentMethod(
  tenantId: string,
  input: PaymentMethodInput
): Promise<PaymentMethodRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [row] = await tx
        .insert(paymentMethods)
        .values({ tenantId, kind: "custom", name: input.name, isEnabled: input.isEnabled })
        .returning();
      await replacePartialAmounts(tx, tenantId, row.id, input.partialAmounts);
      return row;
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function updatePaymentMethod(
  tenantId: string,
  id: string,
  input: PaymentMethodInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx
        .update(paymentMethods)
        .set({ name: input.name, isEnabled: input.isEnabled, updatedAt: new Date() })
        .where(and(eq(paymentMethods.tenantId, tenantId), eq(paymentMethods.id, id)));
      await replacePartialAmounts(tx, tenantId, id, input.partialAmounts);
    } catch (error) {
      friendlyDuplicateError(error);
    }
  });
}

export async function deletePaymentMethod(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(paymentMethods)
      .where(and(eq(paymentMethods.tenantId, tenantId), eq(paymentMethods.id, id)));
  });
}
