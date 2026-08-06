import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { mockPaymentMethods } from "@/lib/mocks/payment-methods";
import * as schema from "./schema";

/** Винесено з seed.ts (правило 400 рядків, CLAUDE.md розділ 0/9.6), той самий прийом, що seed-delivery-methods.ts. Стартові 4 способи оплати — ідемпотентно. */
export async function seedPaymentMethods(
  db: PostgresJsDatabase<typeof schema>,
  tenantId: string
): Promise<void> {
  await db
    .insert(schema.paymentMethods)
    .values(
      mockPaymentMethods.map((method, index) => ({
        tenantId,
        kind: method.kind,
        name: method.name,
        isEnabled: method.isEnabled,
        position: index,
      }))
    )
    .onConflictDoNothing();
}
