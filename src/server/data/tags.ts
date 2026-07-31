import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { tags } from "@/server/db/schema";

export type TagRow = typeof tags.$inferSelect;

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

/** Довідник «Теги» (settings) — та сама таблиця tags, що syncProductTags у server/data/products.ts. */
export async function listTags(tenantId: string): Promise<TagRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx.select().from(tags).where(eq(tags.tenantId, tenantId)).orderBy(asc(tags.label))
  );
}

export async function createTag(tenantId: string, label: string): Promise<TagRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      const [row] = await tx.insert(tags).values({ tenantId, label }).returning();
      return row;
    } catch (error) {
      if (pgErrorCode(error) === "23505") throw new Error("Такий тег вже є");
      throw error;
    }
  });
}

export async function updateTag(tenantId: string, id: string, label: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      await tx.update(tags).set({ label }).where(and(eq(tags.tenantId, tenantId), eq(tags.id, id)));
    } catch (error) {
      if (pgErrorCode(error) === "23505") throw new Error("Такий тег вже є");
      throw error;
    }
  });
}

/** Видалення тегу каскадно прибирає його з product_tags (FK ON DELETE CASCADE) — товари лишаються, лише без цього тегу. */
export async function deleteTag(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(tags).where(and(eq(tags.tenantId, tenantId), eq(tags.id, id)));
  });
}
