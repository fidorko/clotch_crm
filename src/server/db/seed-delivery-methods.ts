import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { mockDeliveryMethods } from "@/lib/mocks/delivery-methods";
import * as schema from "./schema";

/**
 * Винесено з seed.ts (файл переріс ~400 рядків, CLAUDE.md розділ 0/9.6) —
 * окрема функція, викликана з main() однією стрічкою.
 *
 * Стартові 4 способи доставки — ідемпотентно, лише список (назва/carrier_key/
 * увімкнено). 2026-08-06, сьомий прохід (пряма вказівка людини — "способи
 * доставки то одні на тенанта, а от налаштування різні"): конфігурація,
 * специфічна для юридичної особи (ключ, відправник тощо), переїхала в
 * delivery_method_entity_settings — сід її більше не чіпає, бо не знає, якій
 * юридичній особі належить (company_legal_entities не сідується моками,
 * створюється вручну через UI, settings-general.md).
 */
export async function seedDeliveryMethods(
  db: PostgresJsDatabase<typeof schema>,
  tenantId: string
): Promise<void> {
  await db
    .insert(schema.deliveryMethods)
    .values(
      mockDeliveryMethods.map((method, index) => ({
        tenantId,
        carrierKey: method.carrierKey,
        name: method.name,
        requiresApiKey: method.requiresApiKey,
        isEnabled: method.isEnabled,
        position: index,
      }))
    )
    .onConflictDoNothing();
}
