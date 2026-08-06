"use server";

import { revalidatePath } from "next/cache";
import {
  createPaymentStatus as createPaymentStatusInDb,
  deletePaymentStatus as deletePaymentStatusInDb,
  updatePaymentStatus as updatePaymentStatusInDb,
  type PaymentStatusInput,
  type PaymentStatusRow,
} from "@/server/data/payment-statuses";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function parsePaymentStatusInput(name: string, color: string): PaymentStatusInput {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Назва статусу обов'язкова");
  }
  const normalizedColor = color.trim().toUpperCase();
  if (!HEX_RE.test(normalizedColor)) {
    throw new Error("Колір має бути у форматі #RRGGBB");
  }
  return { name: trimmedName, color: normalizedColor };
}

export async function createPaymentStatusAction(name: string, color: string): Promise<PaymentStatusRow> {
  const tenantId = getDevTenantId();
  const input = parsePaymentStatusInput(name, color);
  const row = await createPaymentStatusInDb(tenantId, input);
  revalidatePath("/settings");
  return row;
}

export async function updatePaymentStatusAction(id: string, name: string, color: string): Promise<void> {
  const tenantId = getDevTenantId();
  const input = parsePaymentStatusInput(name, color);
  await updatePaymentStatusInDb(tenantId, id, input);
  revalidatePath("/settings");
}

export async function deletePaymentStatusAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deletePaymentStatusInDb(tenantId, id);
  revalidatePath("/settings");
}
