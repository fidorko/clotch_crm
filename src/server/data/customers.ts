import { and, eq, ilike, or } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { customers } from "@/server/db/schema";

export type CustomerRow = typeof customers.$inferSelect;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Пошук клієнта в комбобоксі форми нового замовлення (orders.md) — по імені
// чи телефону, той самий принцип LIMIT, що listProductSkusCatalog.
const SEARCH_LIMIT = 20;

export async function searchCustomers(tenantId: string, query: string): Promise<CustomerRow[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          or(ilike(customers.name, `%${trimmed}%`), ilike(customers.phone, `%${trimmed}%`))
        )
      )
      .limit(SEARCH_LIMIT)
  );
}

/**
 * Клієнт за нормалізованим телефоном — один номер = один клієнт
 * (`UNIQUE(tenant_id, phone)`), той самий підхід, що штрихкод SKU.
 */
export async function findCustomerByPhone(tenantId: string, phone: string): Promise<CustomerRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.phone, phone)))
      .limit(1);
    return row ?? null;
  });
}

/** Створити чи повернути наявного клієнта за телефоном — виклик усередині транзакції createOrder (server/data/orders.ts). */
export async function createOrGetCustomer(
  tx: Tx,
  tenantId: string,
  input: { name: string; phone: string; email: string | null; comment: string | null }
): Promise<CustomerRow> {
  const [existing] = await tx
    .select()
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), eq(customers.phone, input.phone)))
    .limit(1);
  if (existing) return existing;

  const [row] = await tx
    .insert(customers)
    .values({ tenantId, name: input.name, phone: input.phone, email: input.email, comment: input.comment })
    .returning();
  return row;
}
