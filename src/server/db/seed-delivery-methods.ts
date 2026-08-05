import { and, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { mockDeliveryMethods } from "@/lib/mocks/delivery-methods";
import * as schema from "./schema";

/**
 * Винесено з seed.ts (файл переріс ~400 рядків, CLAUDE.md розділ 0/9.6) —
 * окрема функція, викликана з main() однією стрічкою.
 *
 * Стартові 4 способи доставки — ідемпотентно. Ключ Нової пошти НЕ живе в
 * mockDeliveryMethods (секрети в моки не пишуться, conventions.md) — якщо
 * в оточенні є NP_API_KEY, підставляємо його в уже вставлений рядок
 * "nova_poshta", лише коли apiKey там ще NULL (щоб повторний сід не
 * перезаписував ключ, уведений вручну через UI).
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

  const npApiKey = process.env.NP_API_KEY;
  if (npApiKey) {
    await db
      .update(schema.deliveryMethods)
      .set({ apiKey: npApiKey, isEnabled: true, updatedAt: new Date() })
      .where(
        and(
          eq(schema.deliveryMethods.tenantId, tenantId),
          eq(schema.deliveryMethods.carrierKey, "nova_poshta"),
          isNull(schema.deliveryMethods.apiKey)
        )
      );
  }
}
