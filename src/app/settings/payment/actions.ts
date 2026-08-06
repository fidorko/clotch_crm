"use server";

import { revalidatePath } from "next/cache";
import {
  createPaymentMethod as createPaymentMethodInDb,
  deletePaymentMethod as deletePaymentMethodInDb,
  listAllPaymentMethodPartialAmounts,
  updatePaymentMethod as updatePaymentMethodInDb,
  type PaymentMethodInput,
  type PaymentMethodRow,
} from "@/server/data/payment-methods";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export interface PaymentMethodFormInput {
  name: string;
  isEnabled: boolean;
  partialAmounts: string[];
}

function parsePaymentMethodInput(raw: PaymentMethodFormInput): PaymentMethodInput {
  const name = raw.name.trim();
  if (!name) throw new Error("Назва обов'язкова");

  const seen = new Set<string>();
  const partialAmounts: string[] = [];
  for (const entry of raw.partialAmounts) {
    const value = entry.trim();
    if (!value) continue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("Сума часткової оплати — невід'ємне число");
    }
    if (seen.has(value)) continue; // однакові суми не мають сенсу як окремі варіанти вибору
    seen.add(value);
    partialAmounts.push(value);
  }

  return { name, isEnabled: raw.isEnabled, partialAmounts };
}

export async function createPaymentMethodAction(
  input: PaymentMethodFormInput
): Promise<PaymentMethodRow> {
  const tenantId = getDevTenantId();
  const parsed = parsePaymentMethodInput(input);
  const row = await createPaymentMethodInDb(tenantId, parsed);
  revalidatePath("/settings");
  return row;
}

export async function updatePaymentMethodAction(
  id: string,
  input: PaymentMethodFormInput
): Promise<void> {
  const tenantId = getDevTenantId();
  const parsed = parsePaymentMethodInput(input);
  await updatePaymentMethodInDb(tenantId, id, parsed);
  revalidatePath("/settings");
}

/** Швидкий тогл вмикача зі списку — читає й пише назад поточні варіанти суми, щоб не стерти їх (той самий прийом, що toggleDeliveryMethodAction). */
export async function togglePaymentMethodAction(
  id: string,
  current: PaymentMethodRow,
  isEnabled: boolean
): Promise<void> {
  const tenantId = getDevTenantId();
  const allAmounts = await listAllPaymentMethodPartialAmounts(tenantId);
  await updatePaymentMethodInDb(tenantId, id, {
    name: current.name,
    isEnabled,
    partialAmounts: allAmounts
      .filter((a) => a.paymentMethodId === id)
      .map((a) => a.amount),
  });
  revalidatePath("/settings");
}

export async function deletePaymentMethodAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deletePaymentMethodInDb(tenantId, id);
  revalidatePath("/settings");
}
