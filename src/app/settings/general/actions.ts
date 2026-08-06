"use server";

import { revalidatePath } from "next/cache";
import {
  upsertGeneralSettings,
  type GeneralSettingsInput,
  type GeneralSettingsRow,
} from "@/server/data/general-settings";
import {
  createCompanyLegalEntity,
  deleteCompanyLegalEntity,
  updateCompanyLegalEntity,
  type CompanyLegalEntityInput,
  type CompanyLegalEntityRow,
} from "@/server/data/company-legal-entities";
import type { GeneralSettingsWorkHourEntry } from "@/server/db/schema";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GeneralSettingsFormInput {
  name: string;
  website: string;
  email: string;
  contactPersonName: string;
  contactPersonPosition: string;
  contactPersonPhone: string;
  workHours: GeneralSettingsWorkHourEntry[];
}

function parseGeneralSettingsInput(raw: GeneralSettingsFormInput): GeneralSettingsInput {
  const email = raw.email.trim();
  if (email && !EMAIL_RE.test(email)) {
    throw new Error("Некоректний email");
  }
  return {
    name: raw.name.trim(),
    website: raw.website.trim(),
    email,
    contactPersonName: raw.contactPersonName.trim(),
    contactPersonPosition: raw.contactPersonPosition.trim(),
    contactPersonPhone: raw.contactPersonPhone.trim(),
    workHours: raw.workHours,
  };
}

export async function saveGeneralSettingsAction(
  input: GeneralSettingsFormInput
): Promise<GeneralSettingsRow> {
  const tenantId = getDevTenantId();
  const parsed = parseGeneralSettingsInput(input);
  const row = await upsertGeneralSettings(tenantId, parsed);
  revalidatePath("/settings");
  return row;
}

export interface CompanyLegalEntityFormInput {
  type: CompanyLegalEntityInput["type"];
  name: string;
  edrpou: string;
  isActive: boolean;
}

function parseCompanyLegalEntityInput(raw: CompanyLegalEntityFormInput): CompanyLegalEntityInput {
  const name = raw.name.trim();
  if (!name) throw new Error("Назва обов'язкова");
  const edrpou = raw.edrpou.trim();
  if (!edrpou) throw new Error("ЄДРПОУ обов'язковий");
  return { type: raw.type, name, edrpou, isActive: raw.isActive };
}

export async function createCompanyLegalEntityAction(
  input: CompanyLegalEntityFormInput
): Promise<CompanyLegalEntityRow> {
  const tenantId = getDevTenantId();
  const parsed = parseCompanyLegalEntityInput(input);
  const row = await createCompanyLegalEntity(tenantId, parsed);
  revalidatePath("/settings");
  return row;
}

export async function updateCompanyLegalEntityAction(
  id: string,
  input: CompanyLegalEntityFormInput
): Promise<void> {
  const tenantId = getDevTenantId();
  const parsed = parseCompanyLegalEntityInput(input);
  await updateCompanyLegalEntity(tenantId, id, parsed);
  revalidatePath("/settings");
}

export async function deleteCompanyLegalEntityAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteCompanyLegalEntity(tenantId, id);
  revalidatePath("/settings");
}
