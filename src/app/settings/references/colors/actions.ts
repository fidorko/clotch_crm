"use server";

import { revalidatePath } from "next/cache";
import {
  createColor as createColorInDb,
  deleteColor as deleteColorInDb,
  updateColor as updateColorInDb,
  type ColorRow,
} from "@/server/data/colors";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function parseColorInput(name: string, hex: string): { name: string; hex: string } {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Назва кольору обов'язкова");
  }
  const normalizedHex = hex.trim().toUpperCase();
  if (!HEX_RE.test(normalizedHex)) {
    throw new Error("Код кольору має бути у форматі #RRGGBB");
  }
  return { name: trimmedName, hex: normalizedHex };
}

export async function createColorAction(name: string, hex: string): Promise<ColorRow> {
  const tenantId = getDevTenantId();
  const input = parseColorInput(name, hex);
  const color = await createColorInDb(tenantId, input);
  revalidatePath("/settings");
  return color;
}

export async function updateColorAction(id: string, name: string, hex: string): Promise<void> {
  const tenantId = getDevTenantId();
  const input = parseColorInput(name, hex);
  await updateColorInDb(tenantId, id, input);
  revalidatePath("/settings");
}

export async function deleteColorAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteColorInDb(tenantId, id);
  revalidatePath("/settings");
}
