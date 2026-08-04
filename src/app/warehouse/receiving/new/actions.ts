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
