import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import {
  productSkus,
  products,
  receivingDocumentItemEvents,
  receivingDocumentItems,
  receivingDocuments,
} from "@/server/db/schema";
import { buildPhotoLookup } from "./product-skus";
import { computeReceivingItemStatus, type ReceivingItem } from "@/lib/types/receiving";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface DocumentGuardInfo {
  isPlanned: boolean;
  status: typeof receivingDocuments.$inferSelect.status;
  completedAt: Date | null;
}

async function loadDocumentGuardInfo(
  tx: Tx,
  tenantId: string,
  documentId: string
): Promise<DocumentGuardInfo | null> {
  const [doc] = await tx
    .select({
      isPlanned: receivingDocuments.isPlanned,
      status: receivingDocuments.status,
      completedAt: receivingDocuments.completedAt,
    })
    .from(receivingDocuments)
    .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, documentId)))
    .limit(1);
  return doc ?? null;
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
 * конфлікті на (tenant_id, document_id, product_sku_id). qtyField вирішує
 * виклик (workspace передає "ordered", поки isPlanned && awaiting_delivery,
 * інакше завжди "received" — один документ, не два типи). Зміна received
 * лишає лог-запис у receiving_document_item_events (дати часткових поставок)
 * — але `product_skus.stock` тут **не** чіпаємо: реальне оприходування на
 * склад відбувається одноразово в `completeReceivingDocument`, лише після
 * «Завершити» (пряма вказівка людини, decisions.md).
 */
export async function upsertReceivingDocumentItem(
  tenantId: string,
  documentId: string,
  productSkuId: string,
  qtyField: "ordered" | "received",
  delta = 1
): Promise<ReceivingDocumentItemMutationResult> {
  return withTenant(tenantId, async (tx) => {
    const doc = await loadDocumentGuardInfo(tx, tenantId, documentId);
    if (doc?.completedAt) throw new Error("Документ завершено — редагування недоступне");

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
      await tx.insert(receivingDocumentItemEvents).values({ tenantId, itemId: row.id, delta });
    }

    return { id: row.id, productSkuId: row.productSkuId, ordered: row.ordered, received: row.received };
  });
}

/** Ручне редагування «Планова кількість» — лише для isPlanned, лишається відкритим до завершення документа. */
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

    const doc = await loadDocumentGuardInfo(tx, tenantId, item.documentId);
    if (!doc || !doc.isPlanned) return;
    if (doc.completedAt) throw new Error("Документ завершено — редагування недоступне");

    await tx
      .update(receivingDocumentItems)
      .set({ ordered, updatedAt: new Date() })
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)));
  });
}

/**
 * Ручне редагування «Прийнято» — для простого надходження завжди можна
 * (від моменту створення), для планового — лише після «Прийняти на склад»
 * (status = in_progress). Лишає лог-запис (delta) у
 * receiving_document_item_events; `product_skus.stock` — лише при
 * «Завершити» (`completeReceivingDocument`), не тут.
 */
export async function updateReceivingDocumentItemReceived(
  tenantId: string,
  id: string,
  received: number
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const [item] = await tx
      .select({
        documentId: receivingDocumentItems.documentId,
        received: receivingDocumentItems.received,
      })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)))
      .limit(1);
    if (!item) return;

    const doc = await loadDocumentGuardInfo(tx, tenantId, item.documentId);
    if (!doc) return;
    if (doc.completedAt) throw new Error("Документ завершено — редагування недоступне");
    if (doc.isPlanned && doc.status === "awaiting_delivery") return;

    const delta = received - item.received;

    await tx
      .update(receivingDocumentItems)
      .set({ received, updatedAt: new Date() })
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)));

    if (delta !== 0) {
      await tx.insert(receivingDocumentItemEvents).values({ tenantId, itemId: id, delta });
    }
  });
}

/**
 * Видалення позиції — до «Завершити» документ завжди редагований
 * (`assertDocumentEditable`-гард вище), а стільки й до того `received` цієї
 * позиції ще ніколи не потрапляв у `product_skus.stock` (це відбувається
 * одноразово в `completeReceivingDocument`) — тому відкату залишку тут
 * більше немає, на відміну від попереднього проходу.
 */
export async function deleteReceivingDocumentItem(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const [item] = await tx
      .select({ documentId: receivingDocumentItems.documentId })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)))
      .limit(1);
    if (!item) return;

    const doc = await loadDocumentGuardInfo(tx, tenantId, item.documentId);
    if (doc?.completedAt) throw new Error("Документ завершено — редагування недоступне");

    await tx
      .delete(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.id, id)));
  });
}

export async function deleteReceivingDocumentItems(tenantId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await withTenant(tenantId, async (tx) => {
    const items = await tx
      .select({ documentId: receivingDocumentItems.documentId })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), inArray(receivingDocumentItems.id, ids)));
    if (items.length === 0) return;

    const doc = await loadDocumentGuardInfo(tx, tenantId, items[0].documentId);
    if (doc?.completedAt) throw new Error("Документ завершено — редагування недоступне");

    await tx
      .delete(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), inArray(receivingDocumentItems.id, ids)));
  });
}
