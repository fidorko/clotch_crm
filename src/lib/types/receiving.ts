export type ReceivingItemStatus = "accepted" | "partial" | "not_accepted";

export interface ReceivingItem {
  id: string; // receiving_document_items.id (позиції тепер персистуються)
  productSkuId: string; // product_skus.id — ключ для скан-матчингу/excludeIds
  sku: string;
  barcode: string | null;
  photoUrl: string | null;
  productName: string;
  color: string;
  colorHex: string;
  size: string;
  ordered: number;
  received: number;
  status: ReceivingItemStatus;
}

export const RECEIVING_ITEM_STATUS_META: Record<
  ReceivingItemStatus,
  { label: string; badge: "success" | "warning" | "destructive" }
> = {
  accepted: { label: "Прийнято", badge: "success" },
  partial: { label: "Частково", badge: "warning" },
  not_accepted: { label: "Не прийнято", badge: "destructive" },
};

export function computeReceivingItemStatus(ordered: number, received: number): ReceivingItemStatus {
  if (received <= 0) return "not_accepted";
  if (received >= ordered) return "accepted";
  return "partial";
}

// Один документ на надходження, не пара planned+actual (decisions.md,
// 2026-08-05) — isPlanned лише вмикає проміжний awaiting_delivery, статус
// завжди рухається по цьому самому рядку (той самий enum, що
// receiving_document_status у БД, server/db/schema/receiving.ts).
export type ReceivingDocStatus =
  | "awaiting_delivery"
  | "in_progress"
  | "completed"
  | "completed_with_discrepancy";

export interface ReceivingDocumentListItem {
  id: string;
  number: string;
  isPlanned: boolean;
  status: ReceivingDocStatus;
  supplier: string | null;
  warehouse: string | null;
  date: string | null; // DD.MM.YYYY
  supplierDocument: string | null;
  // Сума ordered/received по позиціях — колонка «Виконання» в списку
  // (лише для isPlanned, warehouse-receiving.md).
  totalOrdered: number;
  totalReceived: number;
  // Злиті лишерком назва/SKU/ШК усіх позицій документа (нижній регістр) —
  // джерело для пошуку в списку за товаром, не лише номером документа.
  itemsSearchText: string;
}

// Кольори — ті самі позапалітрові винятки, що вже задокументовані в
// design.md (blue для проміжного стану, той самий принцип, що раніше був
// «Розбіжність в плюс»). Статус тепер пряме поле документа, не похідне від
// співвідношення ordered/received — рахунок лишився лише всередині
// completeReceivingDocument (server/data/receiving.ts) в момент фіналізації.
export const RECEIVING_DOC_STATUS_META: Record<
  ReceivingDocStatus,
  { label: string; className: string }
> = {
  awaiting_delivery: { label: "Очікується поставка", className: "bg-warning/15 text-warning" },
  in_progress: {
    label: "В процесі",
    className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  completed: { label: "Завершено", className: "bg-success/15 text-success" },
  completed_with_discrepancy: {
    label: "Завершено з розбіжностями",
    className: "bg-destructive/10 text-destructive",
  },
};

export function receivingDocTypeLabel(isPlanned: boolean): string {
  return isPlanned ? "Планове" : "Фактичне";
}

// Тип — планове жовтим, фактичне зеленим (той самий колір, що раніше type-badge).
export function receivingDocTypeBadge(isPlanned: boolean): "warning" | "success" {
  return isPlanned ? "warning" : "success";
}
