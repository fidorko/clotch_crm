"use server";

import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { createActualReceivingFromPlanned, deleteReceivingDocument } from "@/server/data/receiving";

export async function deleteReceivingDocumentAction(id: string): Promise<void> {
  await deleteReceivingDocument(getDevTenantId(), id);
}

// Викликається і зі списку (ReceivingDocumentsTable), і зсередини планового
// документа (PlannedReceivingHeader) — одна дія, дві точки входу.
export async function createActualReceivingFromPlannedAction(plannedDocumentId: string): Promise<{ id: string }> {
  const row = await createActualReceivingFromPlanned(getDevTenantId(), plannedDocumentId);
  return { id: row.id };
}
