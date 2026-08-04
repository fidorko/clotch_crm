export type ReceivingItemStatus = "accepted" | "partial" | "not_accepted";

export interface ReceivingItem {
  id: string;
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
