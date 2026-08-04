import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { productSkus, products, receivingDocumentItems, receivingDocuments } from "@/server/db/schema";
import { buildPhotoLookup } from "./product-skus";
import { computeReceivingItemStatus, type ReceivingItem } from "@/lib/types/receiving";

function pgErrorCode(error: unknown): string | undefined {
  const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
  return typeof cause === "object" && cause !== null && "code" in cause
    ? (cause as { code?: string }).code
    : undefined;
}

/** Позиції одного документа надходження — той самий join, що listProductSkusCatalog, плюс ordered/received. */
export async function listReceivingDocumentItems(
  tenantId: string,
  documentId: string
): Promise<ReceivingItem[]> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: receivingDocumentItems.id,
        productSkuId: receivingDocumentItems.productSkuId,
        ordered: receivingDocumentItems.ordered,
        received: receivingDocumentItems.received,
        productId: productSkus.productId,
        sku: productSkus.code,
        barcode: productSkus.barcode,
        color: productSkus.color,
        colorHex: productSkus.colorHex,
        size: productSkus.size,
        productName: products.name,
      })
      .from(receivingDocumentItems)
      .innerJoin(productSkus, eq(productSkus.id, receivingDocumentItems.productSkuId))
      .innerJoin(products, eq(products.id, productSkus.productId))
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.documentId, documentId)))
      .orderBy(asc(receivingDocumentItems.position));

    const productIds = [...new Set(rows.map((r) => r.productId))];
    const photoByProductColor = await buildPhotoLookup(tx, tenantId, productIds);

    return rows.map((row) => ({
      id: row.id,
      productSkuId: row.productSkuId,
      sku: row.sku,
      barcode: row.barcode,
      photoUrl: photoByProductColor.get(`${row.productId}|${row.color}`) ?? null,
      productName: row.productName,
      color: row.color,
      colorHex: row.colorHex,
      size: row.size,
      ordered: row.ordered,
      received: row.received,
      status: computeReceivingItemStatus(row.ordered, row.received),
    }));
  });
}

export interface ReceivingDocumentItemMutationResult {
  id: string;
  productSkuId: string;
  ordered: number;
  received: number;
}

/**
 * Скан або вибір з AddSkuCombobox — insert, або ordered/received += delta при
 * конфлікті на (tenant_id, document_id, product_sku_id). qtyField покриває
 * обидва режими: "ordered" — планове (скан не чіпає залишок), "received" —
 * фактичне (скан одразу поповнює product_skus.stock тим самим delta —
 * пряме рішення людини, warehouse-receiving.md).
 */
export async function upsertReceivingDocumentItem(
  tenantId: string,
  documentId: string,
  productSkuId: string,
  qtyField: "ordered" | "received",
  delta = 1
): Promise<ReceivingDocumentItemMutationResult> {
  return withTenant(tenantId, async (tx) => {
    const [{ total }] = await tx
      .select({ total: count() })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.documentId, documentId)));

    const [row] = await tx
      .insert(receivingDocumentItems)
      .values({
        tenantId,
        documentId,
        productSkuId,
        ordered: qtyField === "ordered" ? delta : 0,
        received: qtyField === "received" ? delta : 0,
        position: total,
      })
      .onConflictDoUpdate({
        target: [
          receivingDocumentItems.tenantId,
          receivingDocumentItems.documentId,
          receivingDocumentItems.productSkuId,
        ],
        set:
          qtyField === "ordered"
            ? { ordered: sql`${receivingDocumentItems.ordered} + ${delta}`, updatedAt: new Date() }
            : { received: sql`${receivingDocumentItems.received} + ${delta}`, updatedAt: new Date() },
      })
      .returning();

    if (qtyField === "received" && delta !== 0) {
      await tx
        .update(productSkus)
        .set({ stock: sql`${productSkus.stock} + ${delta}`, updatedAt: new Date() })
        .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, productSkuId)));
    }

    return { id: row.id, productSkuId: row.productSkuId, ordered: row.ordered, received: row.received };
  });
}

/** Ручне редагування «Замовлено» — лише для планових документів (гард на сервері, не тільки в UI). */
export async function updateReceivingDocumentItemOrdered(
  tenantId: string,
  id: string,
  ordered: number
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const [item] = await tx
      .select({ documentId: receivingDocumentItems.documentId })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)))
      .limit(1);
    if (!item) return;

    const [doc] = await tx
      .select({ type: receivingDocuments.type })
      .from(receivingDocuments)
      .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, item.documentId)))
      .limit(1);
    if (!doc || doc.type !== "planned") return;

    await tx
      .update(receivingDocumentItems)
      .set({ ordered, updatedAt: new Date() })
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)));
  });
}

/**
 * Ручне редагування «Прийнято» — лише для фактичних документів (гард на
 * сервері), і одразу поповнює product_skus.stock різницею (перше місце в
 * проєкті, де stock узагалі змінюється — db.md).
 */
export async function updateReceivingDocumentItemReceived(
  tenantId: string,
  id: string,
  received: number
): Promise<void> {
  try {
    await withTenant(tenantId, async (tx) => {
      const [item] = await tx
        .select({
          documentId: receivingDocumentItems.documentId,
          productSkuId: receivingDocumentItems.productSkuId,
          received: receivingDocumentItems.received,
        })
        .from(receivingDocumentItems)
        .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)))
        .limit(1);
      if (!item) return;

      const [doc] = await tx
        .select({ type: receivingDocuments.type })
        .from(receivingDocuments)
        .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, item.documentId)))
        .limit(1);
      if (!doc || doc.type !== "actual") return;

      const delta = received - item.received;

      await tx
        .update(receivingDocumentItems)
        .set({ received, updatedAt: new Date() })
        .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)));

      if (delta !== 0) {
        await tx
          .update(productSkus)
          .set({ stock: sql`${productSkus.stock} + ${delta}`, updatedAt: new Date() })
          .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, item.productSkuId)));
      }
    });
  } catch (error) {
    if (pgErrorCode(error) === "23514") {
      throw new Error("Неможливо зменшити прийняту кількість — залишок цього SKU вже використано деінде");
    }
    throw error;
  }
}

export async function deleteReceivingDocumentItem(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const [item] = await tx
      .select({ productSkuId: receivingDocumentItems.productSkuId, received: receivingDocumentItems.received })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)))
      .limit(1);
    if (!item) return;

    await tx
      .delete(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)));

    // Видалення прийнятого рядка відкочує те, що встигло поповнити залишок.
    if (item.received !== 0) {
      await tx
        .update(productSkus)
        .set({ stock: sql`${productSkus.stock} - ${item.received}`, updatedAt: new Date() })
        .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, item.productSkuId)));
    }
  });
}

export async function deleteReceivingDocumentItems(tenantId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await withTenant(tenantId, async (tx) => {
    const items = await tx
      .select({ productSkuId: receivingDocumentItems.productSkuId, received: receivingDocumentItems.received })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), inArray(receivingDocumentItems.id, ids)));

    await tx
      .delete(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), inArray(receivingDocumentItems.id, ids)));

    for (const item of items) {
      if (item.received !== 0) {
        await tx
          .update(productSkus)
          .set({ stock: sql`${productSkus.stock} - ${item.received}`, updatedAt: new Date() })
          .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, item.productSkuId)));
      }
    }
  });
}
