import { and, asc, count, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import {
  suppliers,
  supplierContacts,
  supplierChannels,
  supplierCustomFields,
} from "@/server/db/schema";
import type {
  SupplierChannelInput,
  SupplierContactInput,
  SupplierCustomFieldInput,
  SupplierFormInput,
} from "@/lib/types/supplier";

export type SupplierRow = typeof suppliers.$inferSelect;
export type SupplierContactRow = typeof supplierContacts.$inferSelect;
export type SupplierChannelRow = typeof supplierChannels.$inferSelect;
export type SupplierCustomFieldRow = typeof supplierCustomFields.$inferSelect;

export interface SupplierDetail {
  supplier: SupplierRow;
  contacts: SupplierContactRow[];
  channels: SupplierChannelRow[];
  customFields: SupplierCustomFieldRow[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

export async function listSuppliers(tenantId: string): Promise<SupplierRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId))
      .orderBy(asc(suppliers.createdAt))
  );
}

export async function getSupplierById(
  tenantId: string,
  id: string
): Promise<SupplierDetail | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, id)))
      .limit(1);
    if (!row) return null;

    const [contacts, channels, customFields] = await Promise.all([
      tx
        .select()
        .from(supplierContacts)
        .where(and(eq(supplierContacts.tenantId, tenantId), eq(supplierContacts.supplierId, id)))
        .orderBy(asc(supplierContacts.position)),
      tx
        .select()
        .from(supplierChannels)
        .where(and(eq(supplierChannels.tenantId, tenantId), eq(supplierChannels.supplierId, id)))
        .orderBy(asc(supplierChannels.position)),
      tx
        .select()
        .from(supplierCustomFields)
        .where(
          and(eq(supplierCustomFields.tenantId, tenantId), eq(supplierCustomFields.supplierId, id))
        )
        .orderBy(asc(supplierCustomFields.position)),
    ]);

    return { supplier: row, contacts, channels, customFields };
  });
}

async function insertContacts(
  tx: Tx,
  tenantId: string,
  supplierId: string,
  contacts: SupplierContactInput[]
): Promise<void> {
  if (contacts.length === 0) return;
  await tx.insert(supplierContacts).values(
    contacts.map((c, index) => ({
      tenantId,
      supplierId,
      name: c.name,
      jobTitle: c.jobTitle || null,
      phone: c.phone || null,
      email: c.email || null,
      position: index,
    }))
  );
}

async function insertChannels(
  tx: Tx,
  tenantId: string,
  supplierId: string,
  channels: SupplierChannelInput[]
): Promise<void> {
  if (channels.length === 0) return;
  await tx.insert(supplierChannels).values(
    channels.map((c, index) => ({
      tenantId,
      supplierId,
      kind: c.kind,
      channel: c.channel,
      value: c.value,
      position: index,
    }))
  );
}

async function insertCustomFields(
  tx: Tx,
  tenantId: string,
  supplierId: string,
  fields: SupplierCustomFieldInput[]
): Promise<void> {
  if (fields.length === 0) return;
  await tx.insert(supplierCustomFields).values(
    fields.map((f, index) => ({
      tenantId,
      supplierId,
      label: f.label,
      value: f.value || null,
      position: index,
    }))
  );
}

/**
 * SUP-0001, SUP-0002... — рахується від поточної кількості постачальників
 * тенанта. code — UNIQUE(tenant_id, code); при рідкісній гонці (паралельне
 * створення) insert впаде з 23505 — createSupplier ловить і повторює з
 * наступним номером (до 5 спроб).
 */
async function generateSupplierCode(tx: Tx, tenantId: string): Promise<string> {
  const [row] = await tx
    .select({ total: count() })
    .from(suppliers)
    .where(eq(suppliers.tenantId, tenantId));
  const next = (row?.total ?? 0) + 1;
  return `SUP-${String(next).padStart(4, "0")}`;
}

export async function createSupplier(
  tenantId: string,
  input: SupplierFormInput
): Promise<SupplierRow> {
  return withTenant(tenantId, async (tx) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = await generateSupplierCode(tx, tenantId);
      try {
        const [row] = await tx
          .insert(suppliers)
          .values({
            tenantId,
            name: input.name,
            code,
            type: input.type as SupplierRow["type"],
            isActive: input.isActive,
            website: input.website || null,
            country: input.country || null,
            city: input.city || null,
            address: input.address || null,
            notes: input.notes || null,
          })
          .returning();

        await insertContacts(tx, tenantId, row.id, input.contacts);
        await insertChannels(tx, tenantId, row.id, input.channels);
        await insertCustomFields(tx, tenantId, row.id, input.customFields);
        return row;
      } catch (error) {
        if (pgErrorCode(error) === "23505" && attempt < 4) continue;
        throw error;
      }
    }
    throw new Error("Не вдалося згенерувати код постачальника");
  });
}

export async function updateSupplier(
  tenantId: string,
  id: string,
  input: SupplierFormInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(suppliers)
      .set({
        name: input.name,
        type: input.type as SupplierRow["type"],
        isActive: input.isActive,
        website: input.website || null,
        country: input.country || null,
        city: input.city || null,
        address: input.address || null,
        notes: input.notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, id)));

    await tx
      .delete(supplierContacts)
      .where(and(eq(supplierContacts.tenantId, tenantId), eq(supplierContacts.supplierId, id)));
    await tx
      .delete(supplierChannels)
      .where(and(eq(supplierChannels.tenantId, tenantId), eq(supplierChannels.supplierId, id)));
    await tx
      .delete(supplierCustomFields)
      .where(
        and(eq(supplierCustomFields.tenantId, tenantId), eq(supplierCustomFields.supplierId, id))
      );

    await insertContacts(tx, tenantId, id, input.contacts);
    await insertChannels(tx, tenantId, id, input.channels);
    await insertCustomFields(tx, tenantId, id, input.customFields);
  });
}

export async function deleteSupplier(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.delete(suppliers).where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, id)));
  });
}
