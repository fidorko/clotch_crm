"use server";

import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import {
  createReceivingCustomField,
  createReceivingDocument,
  deleteReceivingCustomField,
  updateReceivingCustomFieldValue,
  updateReceivingDocument,
  type ReceivingCustomFieldRow,
  type ReceivingDocumentInput,
  type ReceivingDocumentRow,
} from "@/server/data/receiving";
import {
  deleteReceivingDocumentItem,
  deleteReceivingDocumentItems,
  updateReceivingDocumentItemOrdered,
  updateReceivingDocumentItemReceived,
  upsertReceivingDocumentItem,
  type ReceivingDocumentItemMutationResult,
} from "@/server/data/receiving-items";

export async function createReceivingDocumentAction(
  input: ReceivingDocumentInput
): Promise<ReceivingDocumentRow> {
  return createReceivingDocument(getDevTenantId(), input);
}

export async function updateReceivingDocumentAction(
  id: string,
  input: Partial<ReceivingDocumentInput>
): Promise<void> {
  await updateReceivingDocument(getDevTenantId(), id, input);
}

export async function createReceivingCustomFieldAction(
  documentId: string,
  label: string
): Promise<ReceivingCustomFieldRow> {
  return createReceivingCustomField(getDevTenantId(), documentId, label);
}

export async function updateReceivingCustomFieldValueAction(id: string, value: string): Promise<void> {
  await updateReceivingCustomFieldValue(getDevTenantId(), id, value);
}

export async function deleteReceivingCustomFieldAction(id: string): Promise<void> {
  await deleteReceivingCustomField(getDevTenantId(), id);
}

export async function upsertReceivingDocumentItemAction(
  documentId: string,
  productSkuId: string,
  qtyField: "ordered" | "received",
  delta = 1
): Promise<ReceivingDocumentItemMutationResult> {
  return upsertReceivingDocumentItem(getDevTenantId(), documentId, productSkuId, qtyField, delta);
}

export async function updateReceivingDocumentItemOrderedAction(id: string, ordered: number): Promise<void> {
  await updateReceivingDocumentItemOrdered(getDevTenantId(), id, ordered);
}

export async function updateReceivingDocumentItemReceivedAction(id: string, received: number): Promise<void> {
  await updateReceivingDocumentItemReceived(getDevTenantId(), id, received);
}

export async function deleteReceivingDocumentItemAction(id: string): Promise<void> {
  await deleteReceivingDocumentItem(getDevTenantId(), id);
}

export async function deleteReceivingDocumentItemsAction(ids: string[]): Promise<void> {
  await deleteReceivingDocumentItems(getDevTenantId(), ids);
}
