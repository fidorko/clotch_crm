import { and, eq, inArray } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { referenceDictionaryFlags } from "@/server/db/schema";

export interface DictionaryFlags {
  showInCrm: boolean;
  showOnStorefront: boolean;
  participatesInFilters: boolean;
}

const DEFAULT_FLAGS: DictionaryFlags = {
  showInCrm: true,
  showOnStorefront: true,
  participatesInFilters: true,
};

/** Довідники без власного рядка (ще не толкали жоден перемикач) — усі 3 за замовчуванням true. */
export async function listDictionaryFlags(
  tenantId: string,
  keys: string[]
): Promise<Record<string, DictionaryFlags>> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select()
      .from(referenceDictionaryFlags)
      .where(and(eq(referenceDictionaryFlags.tenantId, tenantId), inArray(referenceDictionaryFlags.dictionaryKey, keys)));

    const result: Record<string, DictionaryFlags> = {};
    for (const key of keys) {
      const row = rows.find((r) => r.dictionaryKey === key);
      result[key] = row
        ? {
            showInCrm: row.showInCrm,
            showOnStorefront: row.showOnStorefront,
            participatesInFilters: row.participatesInFilters,
          }
        : DEFAULT_FLAGS;
    }
    return result;
  });
}

/** Перемикач прямо на плитці — upsert, бо рядок міг ще не існувати (усі 3 стартують true "віртуально"). */
export async function updateDictionaryFlags(
  tenantId: string,
  dictionaryKey: string,
  patch: Partial<DictionaryFlags>
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .insert(referenceDictionaryFlags)
      .values({ tenantId, dictionaryKey, ...DEFAULT_FLAGS, ...patch })
      .onConflictDoUpdate({
        target: [referenceDictionaryFlags.tenantId, referenceDictionaryFlags.dictionaryKey],
        set: { ...patch, updatedAt: new Date() },
      });
  });
}
