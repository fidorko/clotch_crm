import { and, eq, inArray } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productSkus } from "@/server/db/schema";
import type { ProductSku } from "@/lib/types/product";

function isUniqueViolation(error: unknown): boolean {
  // Drizzle обгортає сиру помилку postgres.js — реальний код лежить у error.cause.code,
  // не в error.code напряму (гочта, задокументована в db.md).
  const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code?: unknown }).code === "23505"
  );
}

function mapSkuRow(row: typeof productSkus.$inferSelect): ProductSku {
  return {
    id: row.id,
    code: row.code,
    color: row.color,
    colorHex: row.colorHex,
    size: row.size,
    barcode: row.barcode ?? "",
    stock: row.stock,
    cell: row.cell ?? "",
  };
}

export interface CreateSkuInput {
  productId: string;
  code: string;
  color: string;
  colorHex: string;
  size: string;
}

/** Один новий SKU (клітинка "+" на перетині кольору й розміру в конструкторі матриці). */
export async function createSku(tenantId: string, input: CreateSkuInput): Promise<ProductSku> {
  try {
    return await withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .insert(productSkus)
        .values({
          tenantId,
          productId: input.productId,
          code: input.code,
          color: input.color,
          colorHex: input.colorHex,
          size: input.size,
        })
        .returning();
      return mapSkuRow(row);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(`SKU з кодом «${input.code}» уже існує`);
    }
    throw error;
  }
}

/** Пакетне створення (кнопка «Автогенерація SKU») — один insert для всіх відсутніх комбінацій. */
export async function createSkus(tenantId: string, inputs: CreateSkuInput[]): Promise<ProductSku[]> {
  if (inputs.length === 0) return [];
  try {
    return await withTenant(tenantId, async (tx) => {
      const rows = await tx
        .insert(productSkus)
        .values(
          inputs.map((input) => ({
            tenantId,
            productId: input.productId,
            code: input.code,
            color: input.color,
            colorHex: input.colorHex,
            size: input.size,
          }))
        )
        .returning();
      return rows.map(mapSkuRow);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Серед автогенерованих SKU є код, що вже існує");
    }
    throw error;
  }
}

/** WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md) — чужий SKU просто не знайдеться. */
export async function deleteSku(tenantId: string, skuId: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(productSkus).where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, skuId)));
  });
}

/** Масове видалення (видалення кольору/розміру цілком — усі SKU цього кольору/розміру). */
export async function deleteSkus(tenantId: string, skuIds: string[]): Promise<void> {
  if (skuIds.length === 0) return;
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(productSkus)
      .where(and(eq(productSkus.tenantId, tenantId), inArray(productSkus.id, skuIds)));
  });
}
