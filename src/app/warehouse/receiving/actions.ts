"use server";

import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import {
  acceptPlannedReceiving,
  completeReceivingDocument,
  createReceivingDocument,
  deleteReceivingDocument,
  type CreateReceivingDocumentInput,
} from "@/server/data/receiving";
import type { ReceivingDocStatus } from "@/lib/types/receiving";

export async function deleteReceivingDocumentAction(id: string): Promise<void> {
  await deleteReceivingDocument(getDevTenantId(), id);
}

// Випадне меню «Додати надходження» (ReceivingHeader) — тип обирається там,
// документ створюється одразу повністю редагованим, без окремого гейту.
export async function createReceivingDocumentAction(
  input: CreateReceivingDocumentInput
): Promise<{ id: string; number: string; status: ReceivingDocStatus }> {
  const row = await createReceivingDocument(getDevTenantId(), input);
  return { id: row.id, number: row.number, status: row.status };
}

// «Прийняти на склад» у шапці планового документа — незворотний перехід
// awaiting_delivery → in_progress.
export async function acceptPlannedReceivingAction(documentId: string): Promise<void> {
  await acceptPlannedReceiving(getDevTenantId(), documentId);
}

// «Завершити» — незворотна фіналізація, після якої акт приймання-передачі
// стає доступним. Повертає новий статус/completedAt напряму (не покладаємось
// на router.refresh() — useState(initialStatus) не перечитує пропси при
// ре-рендері серверного дерева, інакше акт відкривався лише після F5).
export async function completeReceivingDocumentAction(
  documentId: string
): Promise<{ status: ReceivingDocStatus; completedAt: Date | null }> {
  const row = await completeReceivingDocument(getDevTenantId(), documentId);
  return { status: row.status, completedAt: row.completedAt };
}
