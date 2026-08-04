"use server";

import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { deleteReceivingDocument } from "@/server/data/receiving";

export async function deleteReceivingDocumentAction(id: string): Promise<void> {
  await deleteReceivingDocument(getDevTenantId(), id);
}
