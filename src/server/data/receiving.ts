import { and, asc, count, desc, eq, like, sql } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import {
  productSkus,
  products,
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

function isCheckViolation(error: unknown): boolean {
  const cause = error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
  return (
    typeof cause === "object" && cause !== null && "code" in cause && (cause as { code?: unknown }).code === "23514"
  );
}

// Тип фіксується одразу при виборі з випадного меню «Додати надходження»
// (список, ReceivingHeader) — решта шапки (постачальник/відповідальна
// особа/дата/ЕН/коментар) заповнюється вже на сторінці документа,
// автозбереженням, як і решта полів (пряма вказівка людини — «редагувати
// все можна одразу», decisions.md). warehouseId — необов'язковий виняток:
// якщо перейшли з картки конкретного складу (`?warehouseId=`), він
// проставляється вже при створенні й далі показується нередагованим
// текстом (PlannedReceivingInfoForm) — склад приймання не міняють по ходу.
export interface CreateReceivingDocumentInput {
  isPlanned: boolean;
  warehouseId?: string | null;
}

export interface UpdateReceivingDocumentInput {
  supplierId?: string | null;
  warehouseId?: string | null;
  plannedDate?: string | null; // ISO yyyy-mm-dd, конвертоване з DD.MM.YYYY на межі UI
  supplierDocument?: string;
  ttnCarrier?: "nova_poshta" | "ukrposhta" | null;
  ttnNumber?: string;
  responsiblePerson?: string;
  comment?: string;
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

/**
 * Явне створення документа — тип обирається одразу у випадному меню
 * «Додати надходження» (список), документ створюється й одразу відкривається
 * повністю редагованим (нема окремого «розблокування» — пряма вказівка
 * людини). isPlanned фіксується тут раз і назавжди — ніде більше не
 * редагується. Статус одразу відповідний: awaiting_delivery для планового
 * (чекає «Прийняти на склад»), in_progress для простого.
 */
export async function createReceivingDocument(
  tenantId: string,
  input: CreateReceivingDocumentInput
): Promise<ReceivingDocumentRow> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await withTenant(tenantId, async (tx) => {
        const number = await generateReceivingNumber(tx, tenantId);
        const [row] = await tx
          .insert(receivingDocuments)
          .values({
            tenantId,
            number,
            status: input.isPlanned ? "awaiting_delivery" : "in_progress",
            isPlanned: input.isPlanned,
            supplierId: null,
            responsiblePerson: null,
            warehouseId: input.warehouseId ?? null,
            plannedDate: null,
            supplierDocument: null,
            ttnCarrier: null,
            ttnNumber: null,
            comment: null,
          })
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

/**
 * Автозбереження решти полів шапки (conventions.md — без кнопки «Зберегти»
 * після першого разу; сам факт створення документа — окрема явна дія вище).
 * Гард на completedAt — після «Зберегти документ надходження та завершити»
 * жодне поле більше не редагується, ні мовчки, ні з помилкою в консоль:
 * кидаємо explicit error, щоб UI показав причину.
 */
export async function updateReceivingDocument(
  tenantId: string,
  id: string,
  input: UpdateReceivingDocumentInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const [doc] = await tx
      .select({ completedAt: receivingDocuments.completedAt })
      .from(receivingDocuments)
      .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, id)))
      .limit(1);
    if (!doc) return;
    if (doc.completedAt) throw new Error("Документ завершено — редагування недоступне");

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

/**
 * «Прийняти на склад» — лише для планового, лише зі стану «Очікується
 * поставка», незворотно (нема шляху назад, пряма вказівка людини). Guard
 * прямо в WHERE — чужий/непідходящий документ просто не зміниться.
 */
export async function acceptPlannedReceiving(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const updated = await tx
      .update(receivingDocuments)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(
        and(
          eq(receivingDocuments.tenantId, tenantId),
          eq(receivingDocuments.id, id),
          eq(receivingDocuments.isPlanned, true),
          eq(receivingDocuments.status, "awaiting_delivery")
        )
      )
      .returning({ id: receivingDocuments.id });
    if (updated.length === 0) {
      throw new Error("Неможливо прийняти на склад — документ не в стані «Очікується поставка»");
    }
  });
}

/**
 * «Завершити» — незворотна фіналізація, і водночас єдиний момент, коли
 * прийняте реально потрапляє на склад (`product_skus.stock`) — пряма
 * вказівка людини: до цього поля вводяться й зберігаються (persist кожної
 * зміни, як і раніше), але «оприходування» саме тут, одним разом, а не по
 * ходу редагування (decisions.md). Для простого надходження нема бази для
 * порівняння — завжди «Завершено». Для планового — «Завершено з
 * розбіжностями», якщо хоч одна позиція має ordered !== received.
 * completedAt — і момент блокування редагування, і умова доступності акту.
 */
export async function completeReceivingDocument(
  tenantId: string,
  id: string
): Promise<ReceivingDocumentRow> {
  return withTenant(tenantId, async (tx) => {
    const [doc] = await tx
      .select()
      .from(receivingDocuments)
      .where(
        and(
          eq(receivingDocuments.tenantId, tenantId),
          eq(receivingDocuments.id, id),
          eq(receivingDocuments.status, "in_progress")
        )
      )
      .limit(1);
    if (!doc) throw new Error("Документ не в стані «В процесі» — завершити не можна");

    const items = await tx
      .select({
        productSkuId: receivingDocumentItems.productSkuId,
        ordered: receivingDocumentItems.ordered,
        received: receivingDocumentItems.received,
      })
      .from(receivingDocumentItems)
      .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.documentId, id)));

    let finalStatus: "completed" | "completed_with_discrepancy" = "completed";
    if (doc.isPlanned && items.some((item) => item.ordered !== item.received)) {
      finalStatus = "completed_with_discrepancy";
    }

    // Реальне оприходування — сума received кожної позиції додається до
    // залишку одноразово тут (не по ходу редагування, дивись receiving-items.ts).
    for (const item of items) {
      if (item.received !== 0) {
        await tx
          .update(productSkus)
          .set({ stock: sql`${productSkus.stock} + ${item.received}`, updatedAt: new Date() })
          .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, item.productSkuId)));
      }
    }

    const [updated] = await tx
      .update(receivingDocuments)
      .set({ status: finalStatus, completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, id)))
      .returning();
    return updated;
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
 * Видалення дозволене для будь-якого документа незалежно від статусу
 * (2026-08-05, decisions.md). Відкат `product_skus.stock` — лише якщо
 * документ уже завершено (`completedAt`): саме тоді `completeReceivingDocument`
 * реально додав `received` кожної позиції на залишок. До завершення
 * позиції редаговані й видаляються без жодного впливу на stock (не
 * потрапляли туди ще) — інакше відкат віднімав би те, чого не було додано.
 * Після видалення `receiving_document_items` йдуть каскадно (FK
 * `onDelete: cascade`), а за ними — `receiving_document_item_events`. Якщо
 * частину поповненого залишку вже витрачено деінде, відкат впаде на
 * `CHECK (stock >= 0)` — та сама помилка користувачу.
 */
export async function deleteReceivingDocument(tenantId: string, id: string): Promise<void> {
  try {
    await withTenant(tenantId, async (tx) => {
      const [doc] = await tx
        .select({ completedAt: receivingDocuments.completedAt })
        .from(receivingDocuments)
        .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, id)))
        .limit(1);

      if (doc?.completedAt) {
        const items = await tx
          .select({ productSkuId: receivingDocumentItems.productSkuId, received: receivingDocumentItems.received })
          .from(receivingDocumentItems)
          .where(and(eq(receivingDocumentItems.tenantId, tenantId), eq(receivingDocumentItems.documentId, id)));

        for (const item of items) {
          if (item.received !== 0) {
            await tx
              .update(productSkus)
              .set({ stock: sql`${productSkus.stock} - ${item.received}`, updatedAt: new Date() })
              .where(and(eq(productSkus.tenantId, tenantId), eq(productSkus.id, item.productSkuId)));
          }
        }
      }

      await tx
        .delete(receivingDocuments)
        .where(and(eq(receivingDocuments.tenantId, tenantId), eq(receivingDocuments.id, id)));
    });
  } catch (error) {
    if (isCheckViolation(error)) {
      throw new Error("Неможливо видалити — прийнятий залишок цього надходження вже використано деінде");
    }
    throw error;
  }
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
        isPlanned: receivingDocuments.isPlanned,
        status: receivingDocuments.status,
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

    // Агрегати ordered/received (колонка «Виконання») + злитий пошуковий
    // текст по товарах (назва/SKU/ШК) — джерело для пошуку в списку за
    // вмістом документа, не лише номером (warehouse-receiving.md).
    const aggregateRows = await tx
      .select({
        documentId: receivingDocumentItems.documentId,
        totalOrdered: sql<number>`coalesce(sum(${receivingDocumentItems.ordered}), 0)`,
        totalReceived: sql<number>`coalesce(sum(${receivingDocumentItems.received}), 0)`,
        searchText: sql<string>`lower(string_agg(
          coalesce(${products.name}, '') || ' ' || coalesce(${productSkus.code}, '') || ' ' || coalesce(${productSkus.barcode}, ''),
          ' '
        ))`,
      })
      .from(receivingDocumentItems)
      .innerJoin(productSkus, eq(productSkus.id, receivingDocumentItems.productSkuId))
      .innerJoin(products, eq(products.id, productSkus.productId))
      .where(eq(receivingDocumentItems.tenantId, tenantId))
      .groupBy(receivingDocumentItems.documentId);

    const aggregateByDocument = new Map(aggregateRows.map((a) => [a.documentId, a]));

    return rows.map((row) => {
      const aggregate = aggregateByDocument.get(row.id);
      return {
        id: row.id,
        number: row.number,
        isPlanned: row.isPlanned,
        status: row.status,
        supplier: row.supplierName,
        warehouse: row.warehouseName,
        date: formatDateUa(row.plannedDate ?? row.createdAt),
        supplierDocument: row.supplierDocument,
        totalOrdered: Number(aggregate?.totalOrdered ?? 0),
        totalReceived: Number(aggregate?.totalReceived ?? 0),
        itemsSearchText: aggregate?.searchText ?? "",
      };
    });
  });
}
