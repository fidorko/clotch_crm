import { and, desc, eq, lt } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { productActivityLog } from "@/server/db/schema";

export type ProductActivityEventType = "created" | "updated";

export interface ProductActivityLogEntry {
  id: string;
  eventType: ProductActivityEventType;
  occurredAt: Date;
  actorName: string;
  fieldKey: string | null;
  fieldLabel: string | null;
  oldValue: string | null;
  newValue: string | null;
}

const ACTIVITY_LOG_PAGE_SIZE = 60;

/** Сторінка журналу подій товару, найновіші перші; `before` — курсор (occurredAt останнього вже показаного рядка). */
export async function listProductActivityLog(
  tenantId: string,
  productId: string,
  before?: Date
): Promise<ProductActivityLogEntry[]> {
  return withTenant(tenantId, async (tx) => {
    const conditions = [
      eq(productActivityLog.tenantId, tenantId),
      eq(productActivityLog.productId, productId),
    ];
    if (before) conditions.push(lt(productActivityLog.occurredAt, before));

    return tx
      .select({
        id: productActivityLog.id,
        eventType: productActivityLog.eventType,
        occurredAt: productActivityLog.occurredAt,
        actorName: productActivityLog.actorName,
        fieldKey: productActivityLog.fieldKey,
        fieldLabel: productActivityLog.fieldLabel,
        oldValue: productActivityLog.oldValue,
        newValue: productActivityLog.newValue,
      })
      .from(productActivityLog)
      .where(and(...conditions))
      .orderBy(desc(productActivityLog.occurredAt))
      .limit(ACTIVITY_LOG_PAGE_SIZE);
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ActivityLogInsert {
  eventType: ProductActivityEventType;
  actorName: string;
  occurredAt: Date;
  fieldKey?: string | null;
  fieldLabel?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}

/**
 * Пише один чи кілька рядків журналу одним запитом — по-польовий diff
 * одного збереження ділить один і той самий occurredAt (рахується один раз
 * викликачем), щоб на екрані згрупуватись в одну подію. Приймає готовий tx
 * (викликається всередині createProduct/saveProduct), той самий прийом, що
 * syncProductTags.
 */
export async function insertProductActivityLog(
  tx: Tx,
  tenantId: string,
  productId: string,
  entries: ActivityLogInsert[]
): Promise<void> {
  if (entries.length === 0) return;
  await tx.insert(productActivityLog).values(
    entries.map((entry) => ({
      tenantId,
      productId,
      eventType: entry.eventType,
      occurredAt: entry.occurredAt,
      actorName: entry.actorName,
      fieldKey: entry.fieldKey ?? null,
      fieldLabel: entry.fieldLabel ?? null,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
    }))
  );
}
