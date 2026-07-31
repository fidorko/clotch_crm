"use server";

import { revalidatePath } from "next/cache";
import {
  createCurrency as createCurrencyInDb,
  deleteCurrency as deleteCurrencyInDb,
  listCurrencies,
  updateCurrency as updateCurrencyInDb,
  updateCurrencyRate,
  type CurrencyInput,
  type CurrencyRow,
} from "@/server/data/currencies";
import { fetchNbuRate } from "@/server/integrations/nbu";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

const CODE_RE = /^[A-Z]{3}$/;

export interface CurrencyFormInput {
  name: string;
  code: string;
  symbol: string;
  symbolPosition: "before" | "after";
  decimalPlaces: number;
  isActive: boolean;
  isDefault: boolean;
  autoUpdate: boolean;
}

function parseCurrencyInput(raw: CurrencyFormInput): CurrencyInput {
  const name = raw.name.trim();
  if (!name) throw new Error("Назва обов'язкова");

  const code = raw.code.trim().toUpperCase();
  if (!CODE_RE.test(code)) throw new Error("Код валюти — 3 латинські літери (ISO 4217), напр. USD");

  if (raw.symbolPosition !== "before" && raw.symbolPosition !== "after") {
    throw new Error("Некоректна позиція символу");
  }
  if (!Number.isInteger(raw.decimalPlaces) || raw.decimalPlaces < 0 || raw.decimalPlaces > 4) {
    throw new Error("Кількість знаків після коми — від 0 до 4");
  }

  return {
    code,
    name,
    symbol: raw.symbol.trim(),
    symbolPosition: raw.symbolPosition,
    decimalPlaces: raw.decimalPlaces,
    isActive: raw.isActive,
    isDefault: raw.isDefault,
    autoUpdate: raw.autoUpdate,
  };
}

export async function createCurrencyAction(input: CurrencyFormInput): Promise<CurrencyRow> {
  const tenantId = getDevTenantId();
  const parsed = parseCurrencyInput(input);
  const row = await createCurrencyInDb(tenantId, parsed);
  revalidatePath("/settings/references/currencies");
  revalidatePath("/settings");
  return row;
}

export async function updateCurrencyAction(id: string, input: CurrencyFormInput): Promise<void> {
  const tenantId = getDevTenantId();
  const parsed = parseCurrencyInput(input);
  await updateCurrencyInDb(tenantId, id, parsed);
  revalidatePath("/settings/references/currencies");
  revalidatePath("/settings");
}

export async function deleteCurrencyAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteCurrencyInDb(tenantId, id);
  revalidatePath("/settings/references/currencies");
  revalidatePath("/settings");
}

/** Тягне поточний курс з НБУ для однієї (не базової) валюти. */
export async function refreshCurrencyRateAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  const all = await listCurrencies(tenantId);
  const currency = all.find((c) => c.id === id);
  if (!currency) throw new Error("Валюту не знайдено");
  if (currency.isDefault) return;

  const nbuRate = await fetchNbuRate(currency.code);
  if (!nbuRate) throw new Error(`НБУ не має курсу для ${currency.code}`);
  await updateCurrencyRate(tenantId, id, nbuRate.rate);
  revalidatePath("/settings/references/currencies");
}

/** Тягне курси з НБУ для всіх валют з автооновленням (крім базової). */
export async function refreshAllCurrencyRatesAction(): Promise<{ updated: number; failed: string[] }> {
  const tenantId = getDevTenantId();
  const all = await listCurrencies(tenantId);
  const targets = all.filter((c) => !c.isDefault && c.autoUpdate);

  let updated = 0;
  const failed: string[] = [];
  for (const currency of targets) {
    try {
      const nbuRate = await fetchNbuRate(currency.code);
      if (!nbuRate) {
        failed.push(currency.code);
        continue;
      }
      await updateCurrencyRate(tenantId, currency.id, nbuRate.rate);
      updated++;
    } catch {
      failed.push(currency.code);
    }
  }
  revalidatePath("/settings/references/currencies");
  return { updated, failed };
}
