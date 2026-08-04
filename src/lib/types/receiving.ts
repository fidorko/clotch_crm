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

// Тип/статус документа надходження (список /warehouse/receiving) — ті самі
// значення, що enum-и `receiving_document_type`/`receiving_document_status`
// у БД (server/db/schema/receiving.ts), тому спільна мапа підписів годиться
// і для реальних документів, і поки для мок-запасного варіанту.
export type ReceivingDocType = "planned" | "actual";
export type ReceivingDocStatus = "draft" | "expected" | "posted";

export interface ReceivingDocumentListItem {
  id: string;
  number: string;
  type: ReceivingDocType;
  basedOnId: string | null;
  supplier: string | null;
  warehouse: string | null;
  date: string | null; // DD.MM.YYYY
  status: ReceivingDocStatus;
  supplierDocument: string | null;
  // Агреговано з receiving_document_items — джерело для
  // computeReceivingDocDisplayStatus нижче (список /warehouse/receiving,
  // пряма вказівка людини: колір статусу за фактичним співвідношенням
  // замовлено/прийнято, не за сирим enum-полем).
  totalOrdered: number;
  totalReceived: number;
  hasUnplannedItems: boolean;
}

export const RECEIVING_DOC_STATUS_META: Record<
  ReceivingDocStatus,
  { label: string; badge: "secondary" | "warning" | "success" }
> = {
  draft: { label: "Чернетка", badge: "secondary" },
  expected: { label: "Очікується", badge: "warning" },
  posted: { label: "Проведено", badge: "success" },
};

export const RECEIVING_DOC_TYPE_LABEL: Record<ReceivingDocType, string> = {
  planned: "Планове",
  actual: "Фактичне",
};

// Тип — планове жовтим, фактичне зеленим (пряма вказівка людини).
export const RECEIVING_DOC_TYPE_BADGE: Record<ReceivingDocType, "warning" | "success"> = {
  planned: "warning",
  actual: "success",
};

// Статус у списку — не сирий enum-статус документа, а похідний від
// реального співвідношення замовлено/прийнято по позиціях (пряма вказівка
// людини): жовтий/зелений/синій/червоний/фіолетовий. Синій і фіолетовий —
// єдині кольори поза палітрою design.md, додані за прямим проханням.
export type ReceivingDocDisplayStatus = "awaiting" | "completed" | "overage" | "shortage" | "unplanned";

export const RECEIVING_DOC_DISPLAY_STATUS_META: Record<
  ReceivingDocDisplayStatus,
  { label: string; className: string }
> = {
  awaiting: { label: "Очікується поставка", className: "bg-warning/15 text-warning" },
  completed: { label: "Прийнято повністю", className: "bg-success/15 text-success" },
  overage: {
    label: "Розбіжність в плюс",
    className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  shortage: { label: "Розбіжність в мінус", className: "bg-destructive/10 text-destructive" },
  unplanned: {
    label: "Є непланові товари",
    className: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
};

export function computeReceivingDocDisplayStatus(doc: {
  type: ReceivingDocType;
  totalOrdered: number;
  totalReceived: number;
  hasUnplannedItems: boolean;
}): ReceivingDocDisplayStatus {
  // Планове — завжди «Очікується поставка» (received на плановому документі
  // завжди 0 за побудовою, приймання відбувається лише на фактичному).
  if (doc.type === "planned") return "awaiting";
  if (doc.hasUnplannedItems) return "unplanned";
  if (doc.totalReceived === 0) return "awaiting";
  if (doc.totalReceived === doc.totalOrdered) return "completed";
  if (doc.totalReceived > doc.totalOrdered) return "overage";
  return "shortage";
}
