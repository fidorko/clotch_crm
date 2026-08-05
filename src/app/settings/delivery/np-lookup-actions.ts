"use server";

import { NovaPoshtaProvider } from "@/server/carriers/novaposhta/provider";
import type {
  CarrierCity,
  CarrierCounterparty,
  CarrierStreet,
  CarrierWarehouse,
} from "@/server/carriers/carrier.interface";
import type { NovaPoshtaContactPerson, NovaPoshtaPackItem } from "@/server/carriers/novaposhta/mapper";

/**
 * Живі довідники Нової пошти для попапу способу доставки — з уведеним (не
 * обов'язково збереженим) ключем, той самий підхід, що testDeliveryApiKeyAction.
 * Проходить через NovaPoshtaProvider (src/server/carriers/), не напряму до
 * api.novaposhta.ua — уся специфіка перевізника ховається там
 * (docs/carriers/novaposhta/).
 */

type Result<T> = { ok: true; items: T[] } | { ok: false; message: string };

async function toResult<T>(promise: Promise<T[]>): Promise<Result<T>> {
  try {
    return { ok: true, items: await promise };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося з'єднатися з Новою поштою" };
  }
}

export async function searchDeliveryCitiesAction(apiKey: string, query: string): Promise<Result<CarrierCity>> {
  if (!apiKey.trim() || query.trim().length < 2) return { ok: true, items: [] };
  return toResult(new NovaPoshtaProvider(apiKey).getCities(query));
}

export async function searchDeliveryWarehousesAction(
  apiKey: string,
  cityRef: string,
  query: string
): Promise<Result<CarrierWarehouse>> {
  if (!apiKey.trim() || !cityRef) return { ok: true, items: [] };
  return toResult(new NovaPoshtaProvider(apiKey).getWarehouses(cityRef, query));
}

export async function searchDeliveryStreetsAction(
  apiKey: string,
  cityRef: string,
  query: string
): Promise<Result<CarrierStreet>> {
  if (!apiKey.trim() || !cityRef || query.trim().length < 2) return { ok: true, items: [] };
  return toResult(new NovaPoshtaProvider(apiKey).getStreets(cityRef, query));
}

export async function listSenderCounterpartiesAction(apiKey: string): Promise<Result<CarrierCounterparty>> {
  if (!apiKey.trim()) return { ok: true, items: [] };
  return toResult(new NovaPoshtaProvider(apiKey).getCounterparties());
}

export async function listContactPersonsAction(
  apiKey: string,
  counterpartyRef: string
): Promise<Result<NovaPoshtaContactPerson>> {
  if (!apiKey.trim() || !counterpartyRef) return { ok: true, items: [] };
  return toResult(new NovaPoshtaProvider(apiKey).getContactPersons(counterpartyRef));
}

export async function listPackListAction(apiKey: string): Promise<Result<NovaPoshtaPackItem>> {
  if (!apiKey.trim()) return { ok: true, items: [] };
  return toResult(new NovaPoshtaProvider(apiKey).getPackList());
}
