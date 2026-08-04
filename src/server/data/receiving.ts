import { and, asc, count, desc, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { receivingDocumentCustomFields, receivingDocuments, suppliers, warehouses } from "@/server/db/schema";
import { formatDateUa } from "@/lib/date-ua";
import type { ReceivingDocumentListItem } from "@/lib/types/receiving";

export type ReceivingDocumentRow = typeof receivingDocuments.$inferSelect;
export type ReceivingCustomFieldRow = typeof receivingDocumentCustomFields.$inferSelect;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

/** RCV-2026-001... — той самий патерн, що generateWarehouseCode (server/data/warehouses.ts). */
async function generateReceivingNumber(tx: Tx, tenantId: string): Promise<string> {
  const [row] = await tx
    .select({ total: count() })
    .from(receivingDocuments)
    .where(eq(receivingDocuments.tenantId, tenantId));
  const next = (row?.total ?? 0) + 1;
  return `RCV-${new Date().getFullYear()}-${String(next).padStart(3, "0")}`;
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
  return withTenant(tenantId, async (tx) => {
    const number = await generateReceivingNumber(tx, tenantId);
    const [row] = await tx
      .insert(receivingDocuments)
      .values({
        tenantId,
        number,
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
      })
      .returning();
    return row;
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

    return rows.map((row) => ({
      id: row.id,
      number: row.number,
      type: row.type,
      status: row.status,
      basedOnId: row.basedOnId,
      supplier: row.supplierName,
      warehouse: row.warehouseName,
      date: formatDateUa(row.plannedDate ?? row.createdAt),
      supplierDocument: row.supplierDocument,
    }));
  });
}
