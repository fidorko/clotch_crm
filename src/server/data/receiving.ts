import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import {
  receivingDocumentCustomFields,
  receivingDocumentItems,
  receivingDocuments,
  suppliers,
  warehouses,
} from "@/server/db/schema";
import { formatDateUa } from "@/lib/date-ua";
import type { ReceivingDocumentListItem } from "@/lib/types/receiving";

export type ReceivingDocumentRow = typeof receivingDocuments.$inferSelect;
export type ReceivingCustomFieldRow = typeof receivingDocumentCustomFields.$inferSelect;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
  return (
    typeof cause === "object" && cause !== null && "code" in cause && (cause as { code?: unknown }).code === "23505"
  );
}

export interface ReceivingDocumentInput {
  type: "planned" | "actual";
  supplierId: string | null;
  warehouseId: string | null;
  plannedDate: string | null; // ISO yyyy-mm-dd, конвертоване з DD.MM.YYYY на межі UI
  supplierDocument: string;
  ttnCarrier: "nova_poshta" | "ukrposhta" | null;
  ttnNumber: string;
  responsiblePerson: string;
  comment: string;
}

/**
 * RCV-2026-001... — за МАКСИМАЛЬНИМ наявним номером цього року, не
 * count(): count лишається незмінним, якщо видалили документ і лишилась
 * дірка (напр. є лише «002», а «001»/«003+» видалено) — тоді count()+1
 * знову й знову генерував би той самий зайнятий номер, і ретрай на 23505
 * ніколи не знайшов би вільного (ловили на прямій перевірці).
 */
async function generateReceivingNumber(tx: Tx, tenantId: string): Promise<string> {
  const prefix = `RCV-${new Date().getFullYear()}-`;
  const [row] = await tx
    .select({ maxNumber: sql<string | null>`max(${receivingDocuments.number})` })
    .from(receivingDocuments)
    .where(and(eq(receivingDocuments.tenantId, tenantId), like(receivingDocuments.number, `${prefix}%`)));
  const nextSuffix = row?.maxNumber ? Number(row.maxNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(nextSuffix).padStart(3, "0")}`;
}

/**
 * Кожна спроба — ОКРЕМА транзакція (withTenant), не одна спільна: Postgres
 * абортує всю транзакцію після будь-якої помилки (конфлікт унікальності
 * теж), тож "зловити 23505 і продовжити в тій самій tx" не спрацював би —
 * наступний запит одразу впав би з "current transaction is aborted" (саме
 * так і сталось при перевірці цієї функції). Спільна для
 * createReceivingDocument і createActualReceivingFromPlanned.
 */
async function createReceivingDocumentRow(
  tenantId: string,
  values: Omit<typeof receivingDocuments.$inferInsert, "id" | "tenantId" | "number" | "createdAt" | "updatedAt">
): Promise<ReceivingDocumentRow> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await withTenant(tenantId, async (tx) => {
        const number = await generateReceivingNumber(tx, tenantId);
        const [row] = await tx
          .insert(receivingDocuments)
          .values({ tenantId, number, ...values })
          .returning();
        return row;
      });
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 4) continue;
      throw error;
    }
  }
  throw new Error("Не вдалося згенерувати номер документа надходження");
}

/** WHERE tenant_id + id разом (правило 7 розділу 6 CLAUDE.md) — чужий документ просто не знайдеться. */
export async function getReceivingDocument(
  tenantId: string,
  id: string
): Promise<ReceivingDocumentRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(receivingDocuments)
      .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, id)))
      .limit(1);
    return row ?? null;
  });
}

export async function createReceivingDocument(
  tenantId: string,
  input: ReceivingDocumentInput
): Promise<ReceivingDocumentRow> {
  return createReceivingDocumentRow(tenantId, {
    type: input.type,
    status: "draft",
    supplierId: input.supplierId,
    warehouseId: input.warehouseId,
    plannedDate: input.plannedDate,
    supplierDocument: input.supplierDocument || null,
    ttnCarrier: input.ttnCarrier,
    ttnNumber: input.ttnNumber || null,
    responsiblePerson: input.responsiblePerson || null,
    comment: input.comment || null,
  });
}

/** Автозбереження полів форми (conventions.md — без кнопки «Зберегти» після першого разу). */
export async function updateReceivingDocument(
  tenantId: string,
  id: string,
  input: Partial<ReceivingDocumentInput>
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(receivingDocuments)
      .set({
        ...(input.supplierId !== undefined && { supplierId: input.supplierId }),
        ...(input.warehouseId !== undefined && { warehouseId: input.warehouseId }),
        ...(input.plannedDate !== undefined && { plannedDate: input.plannedDate }),
        ...(input.supplierDocument !== undefined && { supplierDocument: input.supplierDocument || null }),
        ...(input.ttnCarrier !== undefined && { ttnCarrier: input.ttnCarrier }),
        ...(input.ttnNumber !== undefined && { ttnNumber: input.ttnNumber || null }),
        ...(input.responsiblePerson !== undefined && {
          responsiblePerson: input.responsiblePerson || null,
        }),
        ...(input.comment !== undefined && { comment: input.comment || null }),
        updatedAt: new Date(),
      })
      .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, id)));
  });
}

export async function listReceivingCustomFields(
  tenantId: string,
  documentId: string
): Promise<ReceivingCustomFieldRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(receivingDocumentCustomFields)
      .where(
        and(
          eq(receivingDocumentCustomFields.tenantId, tenantId),
          eq(receivingDocumentCustomFields.documentId, documentId)
        )
      )
      .orderBy(asc(receivingDocumentCustomFields.position))
  );
}

/** Людина сама називає поле (той самий принцип, що supplier_custom_fields). */
export async function createReceivingCustomField(
  tenantId: string,
  documentId: string,
  label: string
): Promise<ReceivingCustomFieldRow> {
  return withTenant(tenantId, async (tx) => {
    const [{ total }] = await tx
      .select({ total: count() })
      .from(receivingDocumentCustomFields)
      .where(
        and(
          eq(receivingDocumentCustomFields.tenantId, tenantId),
          eq(receivingDocumentCustomFields.documentId, documentId)
        )
      );
    const [row] = await tx
      .insert(receivingDocumentCustomFields)
      .values({ tenantId, documentId, label, position: total })
      .returning();
    return row;
  });
}

export async function updateReceivingCustomFieldValue(
  tenantId: string,
  id: string,
  value: string
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(receivingDocumentCustomFields)
      .set({ value: value || null })
      .where(and(eq(receivingDocumentCustomFields.tenantId, tenantId), eq(receivingDocumentCustomFields.id, id)));
  });
}

/**
 * Лише планове можна видалити — фактичне ні (пряма вказівка людини). Умова
 * — `type = 'planned'` прямо в WHERE поруч із `tenant_id`, а не окрема
 * перевірка після читання: чужий/фактичний документ просто не знайдеться
 * й не видалиться, без різниці в повідомленні про причину.
 */
export async function deleteReceivingDocument(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(receivingDocuments)
      .where(
        and(
          eq(receivingDocuments.tenantId, tenantId),
          eq(receivingDocuments.id, id),
          eq(receivingDocuments.type, "planned")
        )
      );
  });
}

export async function deleteReceivingCustomField(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .delete(receivingDocumentCustomFields)
      .where(and(eq(receivingDocumentCustomFields.tenantId, tenantId), eq(receivingDocumentCustomFields.id, id)));
  });
}

/** Список для /warehouse/receiving — реальні документи, LIMIT (CLAUDE.md розділ 7). */
const DOCUMENTS_LIMIT = 200;

export async function listReceivingDocuments(tenantId: string): Promise<ReceivingDocumentListItem[]> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: receivingDocuments.id,
        number: receivingDocuments.number,
        type: receivingDocuments.type,
        status: receivingDocuments.status,
        basedOnId: receivingDocuments.basedOnId,
        supplierName: suppliers.name,
        warehouseName: warehouses.name,
        plannedDate: receivingDocuments.plannedDate,
        createdAt: receivingDocuments.createdAt,
        supplierDocument: receivingDocuments.supplierDocument,
      })
      .from(receivingDocuments)
      .leftJoin(
        suppliers,
        and(eq(suppliers.id, receivingDocuments.supplierId), eq(suppliers.tenantId, tenantId))
      )
      .leftJoin(
        warehouses,
        and(eq(warehouses.id, receivingDocuments.warehouseId), eq(warehouses.tenantId, tenantId))
      )
      .where(eq(receivingDocuments.tenantId, tenantId))
      .orderBy(desc(receivingDocuments.createdAt))
      .limit(DOCUMENTS_LIMIT);

    // Агрегати замовлено/прийнято на документ — джерело кольору статусу в
    // списку (computeReceivingDocDisplayStatus, lib/types/receiving.ts).
    const aggregateRows = await tx
      .select({
        documentId: receivingDocumentItems.documentId,
        totalOrdered: sql<number>`coalesce(sum(${receivingDocumentItems.ordered}), 0)`,
        totalReceived: sql<number>`coalesce(sum(${receivingDocumentItems.received}), 0)`,
        hasUnplannedItems: sql<boolean>`bool_or(${receivingDocumentItems.ordered} = 0)`,
      })
      .from(receivingDocumentItems)
      .where(eq(receivingDocumentItems.tenantId, tenantId))
      .groupBy(receivingDocumentItems.documentId);

    const aggregateByDocument = new Map(aggregateRows.map((a) => [a.documentId, a]));

    return rows.map((row) => {
      const aggregate = aggregateByDocument.get(row.id);
      return {
        id: row.id,
        number: row.number,
        type: row.type,
        status: row.status,
        basedOnId: row.basedOnId,
        supplier: row.supplierName,
        warehouse: row.warehouseName,
        date: formatDateUa(row.plannedDate ?? row.createdAt),
        supplierDocument: row.supplierDocument,
        totalOrdered: Number(aggregate?.totalOrdered ?? 0),
        totalReceived: Number(aggregate?.totalReceived ?? 0),
        hasUnplannedItems: aggregate?.hasUnplannedItems ?? false,
      };
    });
  });
}

/**
 * «Прийняти на склад» — реальне фактичне приймання на основі планового
 * (пряма вказівка людини, warehouse-receiving.md). Копіює шапку
 * (постачальник/склад/документ постачальника/ЕН) і всі позиції (ordered як
 * у плані, received=0). plannedDate/responsiblePerson/comment навмисно НЕ
 * копіюються — дата фактичного приймання й відповідальний за приймання
 * вводяться заново, не успадковуються з плану.
 */
export async function createActualReceivingFromPlanned(
  tenantId: string,
  plannedDocumentId: string
): Promise<ReceivingDocumentRow> {
  const planned = await withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(receivingDocuments)
      .where(
        and(
          eq(receivingDocuments.tenantId, tenantId),
          eq(receivingDocuments.id, plannedDocumentId),
          eq(receivingDocuments.type, "planned")
        )
      )
      .limit(1);
    return row ?? null;
  });
  if (!planned) throw new Error("Плановий документ не знайдено");

  const actual = await createReceivingDocumentRow(tenantId, {
    type: "actual",
    status: "draft",
    basedOnId: planned.id,
    supplierId: planned.supplierId,
    warehouseId: planned.warehouseId,
    plannedDate: null,
    supplierDocument: planned.supplierDocument,
    ttnCarrier: planned.ttnCarrier,
    ttnNumber: planned.ttnNumber,
    responsiblePerson: null,
    comment: null,
  });

  await withTenant(tenantId, async (tx) => {
    const plannedItems = await tx
      .select()
      .from(receivingDocumentItems)
      .where(
        and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.documentId, planned.id))
      )
      .orderBy(asc(receivingDocumentItems.position));

    if (plannedItems.length > 0) {
      await tx.insert(receivingDocumentItems).values(
        plannedItems.map((item) => ({
          tenantId,
          documentId: actual.id,
          productSkuId: item.productSkuId,
          ordered: item.ordered,
          received: 0,
          position: item.position,
        }))
      );
    }
  });

  return actual;
}
