"use server";

import { revalidatePath } from "next/cache";
import {
  createOrderStatus as createOrderStatusInDb,
  deleteOrderStatus as deleteOrderStatusInDb,
  updateOrderStatus as updateOrderStatusInDb,
  type OrderStatusInput,
  type OrderStatusRow,
} from "@/server/data/order-statuses";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function parseOrderStatusInput(
  name: string,
  color: string,
  notifyAfterHours: number | null,
  notifyUser: string | null
): OrderStatusInput {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Назва статусу обов'язкова");
  }
  const normalizedColor = color.trim().toUpperCase();
  if (!HEX_RE.test(normalizedColor)) {
    throw new Error("Колір має бути у форматі #RRGGBB");
  }
  if (notifyAfterHours !== null && (!Number.isInteger(notifyAfterHours) || notifyAfterHours <= 0)) {
    throw new Error("Кількість годин має бути цілим додатним числом");
  }
  return {
    name: trimmedName,
    color: normalizedColor,
    // Сповіщення — разом або ніяк: без годин прибираємо й користувача.
    notifyAfterHours,
    notifyUser: notifyAfterHours !== null ? notifyUser : null,
  };
}

export async function createOrderStatusAction(
  name: string,
  color: string,
  notifyAfterHours: number | null,
  notifyUser: string | null
): Promise<OrderStatusRow> {
  const tenantId = getDevTenantId();
  const input = parseOrderStatusInput(name, color, notifyAfterHours, notifyUser);
  const row = await createOrderStatusInDb(tenantId, input);
  revalidatePath("/settings");
  return row;
}

export async function updateOrderStatusAction(
  id: string,
  name: string,
  color: string,
  notifyAfterHours: number | null,
  notifyUser: string | null
): Promise<void> {
  const tenantId = getDevTenantId();
  const input = parseOrderStatusInput(name, color, notifyAfterHours, notifyUser);
  await updateOrderStatusInDb(tenantId, id, input);
  revalidatePath("/settings");
}

export async function deleteOrderStatusAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteOrderStatusInDb(tenantId, id);
  revalidatePath("/settings");
}
