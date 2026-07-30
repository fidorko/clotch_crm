"use server";

import { revalidatePath } from "next/cache";
import {
  createSupplier as createSupplierInDb,
  deleteSupplier as deleteSupplierInDb,
  updateSupplier as updateSupplierInDb,
  type SupplierRow,
} from "@/server/data/suppliers";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import type { SupplierFormInput } from "@/lib/types/supplier";

function normalizeInput(input: SupplierFormInput): SupplierFormInput {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Назва компанії обов'язкова");
  }

  return {
    ...input,
    name,
    website: input.website.trim(),
    country: input.country.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    notes: input.notes.trim().slice(0, 500),
    contacts: input.contacts
      .map((c) => ({
        name: c.name.trim(),
        jobTitle: c.jobTitle.trim(),
        phone: c.phone.trim(),
        email: c.email.trim(),
      }))
      .filter((c) => c.name || c.jobTitle || c.phone || c.email),
    channels: input.channels
      .map((c) => ({ ...c, value: c.value.trim() }))
      .filter((c) => c.value),
    customFields: input.customFields
      .map((f) => ({ label: f.label.trim(), value: f.value.trim() }))
      .filter((f) => f.label),
  };
}

export async function createSupplierAction(input: SupplierFormInput): Promise<SupplierRow> {
  const tenantId = getDevTenantId();
  const clean = normalizeInput(input);
  const supplier = await createSupplierInDb(tenantId, clean);
  revalidatePath("/settings/references/suppliers");
  return supplier;
}

export async function updateSupplierAction(id: string, input: SupplierFormInput): Promise<void> {
  const tenantId = getDevTenantId();
  const clean = normalizeInput(input);
  await updateSupplierInDb(tenantId, id, clean);
  revalidatePath("/settings/references/suppliers");
  revalidatePath(`/settings/references/suppliers/${id}`);
}

export async function deleteSupplierAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteSupplierInDb(tenantId, id);
  revalidatePath("/settings/references/suppliers");
}
